export default class RangePicker {
  element;
  subElements = {};
  selected = {
    from: new Date(),
    to: new Date()
  };

  constructor({
    from = new Date(),
    to = new Date()} = {}
  ) { 
    this.showDateFrom = new Date(from);
    this.selected = { from, to };            
  }

  formatDate(date) {
    return date.toLocaleString("ru", { dateStyle:"short" });    
  }

  getFirsDayOfMonthDay(date){
    let firsDayOfMonthDay = new Date(date.getFullYear(), date.getMonth(), 1).getDay();     
    return firsDayOfMonthDay == 0 ? 7 : firsDayOfMonthDay;
  }

  getMonthDayCount(date){
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  }

  get template () {
    return `
    <div class="container">
      <div class="rangepicker">
        <div class="rangepicker__input" data-elem="input">
          <span data-elem="from">${this.formatDate(this.selected.from)}</span> -
          <span data-elem="to">${this.formatDate(this.selected.to)}</span>
        </div>
        <div class="rangepicker__selector" data-elem="selector"></div>
      </div>
    </div>`;
  }

  renderSelector(){    
    this.subElements.selector.innerHTML = `
    <div class="rangepicker__selector-arrow"></div>
    <div class="rangepicker__selector-control-left"></div>
    <div class="rangepicker__selector-control-right"></div>    
    ${this.rederPicker(this.showDateFrom)}
    ${this.rederPicker(new Date(this.showDateFrom.getFullYear(), this.showDateFrom.getMonth() + 1, 1))}`;
  }      

  renderPickerDays(date){                 
    return ','.repeat(this.getMonthDayCount(date))
      .split(',')
      .reduce((prevValue, item, index) => {                               
        return prevValue += `<button type="button" ${ !prevValue ? `style="--start-from:${this.getFirsDayOfMonthDay(date)}"`: ''} class="rangepicker__cell" data-value="${new Date(date.getFullYear(), date.getMonth(), index, date.getUTCHours(), 0, 0, 0).toISOString()}">${index}</button>`
      }); 
  }

  rederPicker(date){             
    return `
    <div class="rangepicker__calendar">
      <div class="rangepicker__month-indicator">
        <time datetime="${ date.toLocaleString('ru', { month: 'long' }) }">${ date.toLocaleString('ru', { month: 'long' }) }</time>
      </div>
      <div class="rangepicker__day-of-week">
        <div>Пн</div>
        <div>Вт</div>
        <div>Ср</div>
        <div>Чт</div>
        <div>Пт</div>
        <div>Сб</div>
        <div>Вс</div>
      </div>
      <div class="rangepicker__date-grid">
      ${ this.renderPickerDays(date) }        
      </div>
    </div>`;
  }

  renderHighlight() {
    for (let rangepickerCell of this.element.querySelectorAll(".rangepicker__cell")){
      rangepickerCell.classList.remove("rangepicker__selected-from");
      rangepickerCell.classList.remove("rangepicker__selected-between");
      rangepickerCell.classList.remove("rangepicker__selected-to");

      this.selected.from && rangepickerCell.dataset.value === this.selected.from.toISOString()
        ? rangepickerCell.classList.add("rangepicker__selected-from")
        : this.selected.to && rangepickerCell.dataset.value === this.selected.to.toISOString()
          ? rangepickerCell.classList.add("rangepicker__selected-to")
          : this.selected.from && 
            this.selected.to && 
            new Date(rangepickerCell.dataset.value) >= this.selected.from && 
            new Date(rangepickerCell.dataset.value) <= this.selected.to && 
            rangepickerCell.classList.add("rangepicker__selected-between");      
    }
  }

  render() {
    const element = document.createElement('div');
    element.innerHTML = this.template;
    this.element = element.firstElementChild;
    this.subElements = this.getSubElements(this.element);

    this.initEventListeners();

    return this.element;
  }  

  getSubElements (element) {
    const elements = element.querySelectorAll('[data-elem]');
    return [...elements].reduce((accum, subElement) => {
      accum[subElement.dataset.elem] = subElement;

      return accum;
    }, {});    
  }

  onSelectorClick = (event) => {         
    if (event.target.classList.contains('rangepicker__selector-control-left')){
      this.showDateFrom.setMonth(this.showDateFrom.getMonth() - 1);
      this.renderSelector();
      this.renderHighlight();
    }
    
    if (event.target.classList.contains('rangepicker__selector-control-right')){
      this.showDateFrom.setMonth(this.showDateFrom.getMonth() + 1);
      this.renderSelector();
      this.renderHighlight();
    } 

    if (event.target.classList.contains('rangepicker__cell') && event.target.dataset.value){      
      const selectedDate = new Date(event.target.dataset.value);      
      if (this.selected.to){
        this.selected = { from: selectedDate, to: null};
      } else if (this.selected.from) {
        if (selectedDate > this.selected.from){
          this.selected.to = selectedDate;
        } else {
          this.selected.to = this.selected.from;
          this.selected.from = selectedDate;
        }        
      }

      this.renderHighlight();

      if (this.selected.from && this.selected.to){
        this.element.dispatchEvent(new CustomEvent("date-select", { bubbles: true, detail: this.selected }))
        this.element.classList.remove("rangepicker_open");
        this.subElements.from.innerHTML = this.formatDate(this.selected.from);
        this.subElements.to.innerHTML = this.formatDate(this.selected.to);
      }    
    }    
  } 
 
  onInputClick = (event) => { 
    this.element.classList.toggle('rangepicker_open'); 
    this.renderSelector();
    this.renderHighlight();
  }

  onNotElementClick = (event) => { 
    this.element.classList.contains("rangepicker_open") && this.element.classList.remove("rangepicker_open");  
  }

  onDocumentClick = (event) => {                
    !this.element.contains(event.target) && this.onNotElementClick(event);
    event.target.closest('.rangepicker__input') && this.onInputClick(event);
    event.target.closest('.rangepicker__selector') && this.onSelectorClick(event);    
  }

  initEventListeners () { 
    document.addEventListener("click", this.onDocumentClick);       
  }

  removeEventListeners () {
    document.removeEventListener('click', this.onDocumentClick)
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