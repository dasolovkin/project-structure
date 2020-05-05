import header from './bestsellers-header.js';
import SortableTable from "../../components/sortable-table/index.js";
import ColumnChart from "../../components/column-chart/index.js";
import RangePicker from "../../components/range-picker/index.js";

export default class Page {
  element;
  subElements = {};
  components = {};

  constructor () {
    this.initComponents();
    this.initEventListeners();
  }

  initComponents () {
    const dateFrom = new Date();
    const dateTo = new Date(); 
    dateFrom.setMonth(dateFrom.getMonth() - 1);
           
    const rangePicker = new RangePicker({
      from: dateFrom,
      to: dateTo
    });
        
    const sortableTable = new SortableTable(header, {
      url: 'api/dashboard/bestsellers',
      searchParameters: {
        from: dateFrom.toISOString(),
        to: dateTo.toISOString()
      },
      isSortLocally: true
    });
    
    const ordersChart = new ColumnChart({
      url: 'api/dashboard/orders',
      from: dateFrom,
      to: dateTo,
      label: 'orders',      
      link: '/sales'
    });
    
    const salesChart = new ColumnChart({
      url: 'api/dashboard/sales',
      from: dateFrom,
      to: dateTo,
      label: 'sales',
      formatNumber: value => `$${value.toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1,')}`     
    });

    const customersChart = new ColumnChart({
      url: 'api/dashboard/customers',
      from: dateFrom,
      to: dateTo,      
      label: 'customers'
    });

    this.components.rangePickerRoot = rangePicker;
    this.components.sortableTable = sortableTable;
    this.components.ordersChart = ordersChart;
    this.components.salesChart = salesChart;
    this.components.customersChart = customersChart;
  }

  get template () {
    return `<div class="dashboard">
      <div class="content__top-panel">
        <h2 class="page-title">Dashboard</h2>

        <!-- RangePicker component -->
        <div data-element="rangePickerRoot">          
        </div>
      </div>
      <div data-element="chartsRoot" class="dashboard__charts">

        <!-- column-chart components -->
        <div data-element="ordersChart" class="dashboard__chart_orders"></div>
        <div data-element="salesChart" class="dashboard__chart_sales"></div>
        <div data-element="customersChart" class="dashboard__chart_customers"></div>
      </div>
      <h3 class="block-title">Best sellers</h3>

      <!-- sortable-table component -->
      <div data-element="sortableTable">       
      </div>
    </div>`;
  }

  async render () {
    const element = document.createElement('div');
    element.innerHTML = this.template;
    this.element = element.firstElementChild;
    this.subElements = this.getSubElements(this.element);

    await this.renderComponents();

    return this.element;
  }

  async renderComponents () {    
    const promises = Object.values(this.components).map(item => item.render());
    const elements = await Promise.all(promises);

    Object.keys(this.components).forEach((component, index) => {
      this.subElements[component].append(elements[index]);
    });
  }

  getSubElements ($element) {
    const elements = $element.querySelectorAll('[data-element]');

    return [...elements].reduce((accum, subElement) => {
      accum[subElement.dataset.element] = subElement;

      return accum;
    }, {});
  }

  onRangePickerDateSelect = event => {    
    this.components.sortableTable.searchParameters.from = event.detail.from.toISOString();
    this.components.sortableTable.searchParameters.to = event.detail.to.toISOString();   
    this.components.sortableTable.sortOnServer();

    this.components.ordersChart.from = event.detail.from;
    this.components.ordersChart.to = event.detail.to;
    this.components.ordersChart.loadDateFromServer();

    this.components.salesChart.from = event.detail.from;
    this.components.salesChart.to = event.detail.to;
    this.components.salesChart.loadDateFromServer();

    this.components.customersChart.from = event.detail.from;
    this.components.customersChart.to = event.detail.to;
    this.components.customersChart.loadDateFromServer();
  }

  initEventListeners () {
    document.addEventListener("date-select", this.onRangePickerDateSelect);          
  }

  destroy () {
    document.removeEventListener("date-select", this.onRangePickerDateSelect);       

    for (const component of Object.values(this.components)) {
      component.destroy();
    }
  }
}
