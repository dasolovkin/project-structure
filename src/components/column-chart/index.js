import fetchJson from "../../utils/fetch-json.js"

const BACKEND_URL = 'https://course-js.javascript.ru';

export default class ColumnChart {
  element;
  subElements = {};
  chartHeight = 50;

  constructor({
    url,
    from,
    to,
    label = '',
    link = '',
    formatNumber =  value => value
  } = {}) {
    this.url = new URL(url, BACKEND_URL);
    this.from = from;
    this.to = to;
    this.label = label;
    this.link = link;  
    this.formatNumber = formatNumber;      
  }

  formatDate(date) {
    return date.toLocaleString("ru", { dateStyle:"long" });    
  }

  getColumnBody(data) {    
    const maxValue = this.getMaxData(data);

    let result = '';
    for(let item in data){
      const scale = this.chartHeight / maxValue ;     
      result += `<div style="--value:${Math.floor(data[item] * scale)}" data-tooltip="<div><small>${this.formatDate(new Date(Date.parse(item)))}</small></div><strong>${this.formatNumber(data[item])}</strong>" class=""></div>`
    }
    
    return result;
  }

  getLink() {
    return this.link ? `<a class="column-chart__link" href="${this.link}">View all</a>` : '';
  }

  get template () {
    return `  
      <div class="column-chart" style="--chart-height: ${this.chartHeight}">
        <div class="column-chart__title">
          Total ${this.label}
          ${this.getLink()}
        </div>
        <div class="column-chart__container">
          <div data-element="header" class="column-chart__header">            
          </div>
          <div data-element="body" class="column-chart__chart">            
          </div>
        </div>
      </div>
    `;
  }

  async loadData () {      
    this.url.searchParams.set('from', this.from.toISOString());
    this.url.searchParams.set('to', this.to.toISOString());
   
    this.element.classList.add('column-chart_loading');
        
    const result = await fetchJson(this.url);        
    
    this.element.classList.remove(`column-chart_loading`);

    return result;
  }

  getMaxData(data){
    let result = 0;
    for(let item in data){
      if (data[item] > result){
        result = data[item];
      }
    }

    return result;
  }

  getDataSum(data){
    let result = 0;
    for(let item in data){
      result += data[item];      
    }

    return result;
  }

  async render() {
    const element = document.createElement('div');
    element.innerHTML = this.template;
    this.element = element.firstElementChild;
    this.subElements = this.getSubElements(this.element);

    this.loadDateFromServer();
    this.initEventListeners();
    
    return this.element;
  }

  async loadDateFromServer() {
    const loadData = await this.loadData();

    this.subElements.body.innerHTML = this.getColumnBody(loadData);
    this.subElements.header.innerHTML = this.formatNumber(this.getDataSum(loadData));
  }

  getSubElements (element) {
    const elements = element.querySelectorAll('[data-element]');

    return [...elements].reduce((accum, subElement) => {
      accum[subElement.dataset.element] = subElement;

      return accum;
    }, {});
  }

  onMouseOver (event){    
    if (this.currentElem != null) {
      return;
    }

    let colomnCartElement = event.target.closest('.column-chart__chart');
    if (!colomnCartElement) {
      return;
    }

    event.target.classList.add('is-hovered');
    colomnCartElement.classList.add('has-hovered'); 

    this.currentElem = event.target;
  }

  onMouseOut (event){    
    if (this.currentElem == null) {
      return;
    }

    let colomnCartElement = event.target.closest('.column-chart__chart');
    if (!colomnCartElement) {
      return;
    }

    this.currentElem.classList.remove('is-hovered');
    colomnCartElement.classList.remove('has-hovered'); 

    this.currentElem = null;
  }

  initEventListeners () { 
    this.element.addEventListener("mouseover", this.onMouseOver);    
    this.element.addEventListener("mouseout", this.onMouseOut);         
  }

  removeEventListeners () {
    this.element.removeEventListener("mouseover", this.onMouseOver);    
    this.element.removeEventListener("mouseout", this.onMouseOut);     
  }
  
  update ({headerData, bodyData}) {
    this.subElements.header.textContent = headerData;
    this.subElements.body.innerHTML = this.getColumnBody(bodyData);
  }

  remove() {
    this.element.remove();
    this.removeEventListeners(); 
  }

  destroy() {
    this.remove();
    this.subElements = {};
  }  
}
