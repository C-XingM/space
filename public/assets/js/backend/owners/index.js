define(['jquery', 'bootstrap', 'backend', 'table', 'form', 'baidueditor'], function ($, undefined, Backend, Table, Form, UE) {
  //重置
$('#start_time').attr('data-date-min-date',getRecentDay(0));
$('#start_time').attr('data-date-max-date',getRecentDay(7));
 $('#end_time').attr('data-date-min-date',getRecentDay(0));
 $('#end_time').attr('data-date-max-date',getRecentDay(7));
  function getRecentDay(day){
        var today = new Date();
        var targetday_milliseconds=today.getTime() + 1000*60*60*24*day;
        today.setTime(targetday_milliseconds);
        var tYear = today.getFullYear();
        var tMonth = today.getMonth();
        var tDate = today.getDate();
        tMonth = doHandleMonth(tMonth + 1);
        tDate = doHandleMonth(tDate);
        return tYear+"-"+tMonth+"-"+tDate;
    }
    function doHandleMonth(month){
        var m = month;
        if(month.toString().length == 1){
            m = "0" + month;
        }
        return m;
    }
  var Controller = {
            index: function () {
                // 初始化表格参数配置
                Table.api.init({
                    extend: {
                        index_url: 'owners/index',//'service/activity',
                        //add_url: 'house/index/add',
                        //edit_url: 'owners/index/edit',
                        //edit_url: 'house/index/edit',
                        // del_url: 'house/index/del',
                        table: 'owners'
                    }
                });
    
                var table = $("#table");
    
                // 初始化表格
                table.bootstrapTable({
                    //url: $.fn.bootstrapTable.defaults.extend.index_url,
                    escape: false,
                    pk: 'id',
                    sortName: 'community_code,building_code,create_time',
                    sortOrder: 'asc,asc,desc',
                    pagination: true,
                    pageSize: 10,
                    commonSearch: false,
                    clickToSelect: false,
                    search:false,
                    queryParams: function queryParams(params) {
                        var searchForm= $("form[role=form]");
                        if(searchForm.length){
                            var searchFields = searchForm.serializeArray();
                            for(var i=0;i<searchFields.length;i++) {
                                if(searchFields[i]['value']) {
                                    params[searchFields[i]['name']] = searchFields[i]['value'];
                                }
                            }
                        }
                        return params;
                    },
                    queryParamsType : "limit",
                    columns: [
                        [
                            {checkbox: true},
                            {
                              field: 'no',
                              title: __('TableID'),
                              align: "center",
                              formatter: function (value, row, index) {
                                  //获取每页显示的数量
                                  var pageSize=$('#table').bootstrapTable('getOptions').pageSize;
                                  //获取当前是第几页
                                  var pageNumber=$('#table').bootstrapTable('getOptions').pageNumber;
                                  //返回序号，注意index是从0开始的，所以要加上1
                                  return pageSize * (pageNumber - 1) + index + 1;
                              }
                            },
                            {field: 'community', title: __('Community'), formatter: function (community) {
                                if(community) {
                                    return community.name;
                                }
                                return '';
                            }},
                            {field: 'building', title: __('Building'),  formatter: function (building) {
                                if(building) {
                                    return building.name;
                                }
                                return '';
                            }},
                            {field: 'name', title: __('House'), operate: false},
                            {field: 'operate', title: __('Operate'), table: table, buttons: [
                              {name: 'apply', text: '申请', title: '申请场地', icon: '', classname: 'btn btn-xs btn-danger btn-dialog', url: 'service/activity/apply'},
                              ], operate:false, formatter: Table.api.formatter.buttons
                            }
                        ]
                    ]
                });
    
          // 为表格绑定事件
          Table.api.bindevent(table);
          Controller.handleCommunityState(true);
          $("#community_code").change();
          Controller.api.bindevent();
          $("#common_search").bind("click",function () {
              table.bootstrapTable('refresh',{
                  url: $.fn.bootstrapTable.defaults.extend.index_url,
                  pageNumber: 1
              });
          });
      },
      detail: function () {
          Controller.api.bindevent();
      },
      add: function () {       
          Controller.api.bindevent();
      },
      apply: function () {    
        Controller.api.bindevent();
      },
      edit: function () {
          Controller.handleCommunityState();
          $("#community_code").change();
          Controller.api.bindevent();
      },
     
      api: {
          bindevent: function () {
              Form.api.bindevent($("form[role=form]"));
          }
      },
      handleCommunityState: function (showAll) {
        var building_id = $("#building_id").val();
          $("#community_code").bind("change",function(){
              var community_code = $(this).val();
              $.ajax({
                  type: "POST",
                  url: 'owners/index/get_building_by_cm_code',
                  async: true,
                  cache: false,
                  dataType : "json",
                  data: {community_code:community_code},
                  success: function(data) {
                      var building = data.building;

                      var buildingHtml = showAll ? '<option value="">全部</option>' : '';
                      $.each(building,function(index,item){
                          buildingHtml += '<option value="'+item.code+'">'+item.name+'</option>';
                      });
                      if(buildingHtml == ''){
                          buildingHtml = '<option value="">没有任何选中项</option>';
                      }
                      $("#building_code").html(buildingHtml);
                      if (building_id) {
                          $("#building_code").val(building_id);
                      }
                      $("#building_code").selectpicker({
                          showTick:true,
                          liveSearch:true
                      });
                      $("#building_code").selectpicker("refresh");
                  }
              });
          });
          var house_id = $("#house_id").val();
          $("#building_code").bind("change",function(){
              var building_code = $(this).val();
              $.ajax({
                  type: "POST",
                  url: 'owners/index/get_house_by_cm_code',
                  async: true,
                  cache: false,
                  dataType : "json",
                  data: {building_code:building_code},
                  success: function(data) {
                      var house = data.house;

                      var houseHtml = showAll ? '<option value="">全部</option>' : '';
                      $.each(house,function(index,item){
                          houseHtml += '<option value="'+item.code+'">'+item.name+'</option>';
                      });
                      if(houseHtml == ''){
                          houseHtml = '<option value="">没有任何选中项</option>';
                      }
                      $("#house_code").html(houseHtml);
                      if (house_id) {
                          $("#house_code").val(house_id);
                      }
                      $("#house_code").selectpicker({
                          showTick:true,
                          liveSearch:true
                      });
                      $("#house_code").selectpicker("refresh");
                  }
              });
          });
          
      } , 
  };
  return Controller;
});