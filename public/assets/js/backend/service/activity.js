define(['jquery', 'bootstrap', 'backend', 'table', 'form', 'baidueditor'], function ($, undefined, Backend, Table, Form, UE) {

    var Controller = {
        index: function () {
            // 初始化表格参数配置
            Table.api.init({
                extend: {
                    index_url: 'service/activity',
                    add_url: 'service/activity/add',
                    edit_url: 'service/activity/edit',
                    del_url: 'service/activity/del',
                    detail_url: 'service/activity/detail',
                    table: 'service',
                    //设置不同操作下的弹窗宽高
                    area: {
                      detail:['800px','90%']
                    }
                }
            });

            var table = $("#table");

            // 初始化表格
            table.bootstrapTable({
                url: $.fn.bootstrapTable.defaults.extend.index_url,
                escape: false,
                pk: 'id',
                sortName: 'create_time',
                sortOrder: 'desc',
                pagination: true,
                pageSize: 10,
                commonSearch: false,
                queryParams: function queryParams(params) {
                    var searchForm = $("form[role=form]");
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
                        //{field: 'id', title: __('Id')},
                        {
                          field: 'no',
                          title: __('TableID'),
                          //sortable: true,
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
                        {field: 'id', title: __('申请编号')},
                        {field: 'admin', title: __('Admin'), formatter: function (admin) {
                          if(admin) {
                              return admin.nickname+"("+admin.username+")";
                          }
                          return '';
                        }},
                        //{field: 'tel', title: __('Tel'), operate: false},
                        //{field: 'sponsor_unit', title: __('SponsorUnit'), operate: false},
                        //{field: 'title', title: __('Title'), operate: false},
                        {field: 'type', title: __('Type'), operate: false, formatter: function (value) {
                          var types = ['Teaching','Recreational','Others']
                          return Table.api.formatter.types(types[value]);
                        }},
                        {field: 'community', title: __('Community'), visible: false, formatter: function (community) {
                            if(community) {
                                return community.name;
                            }
                            return '';
                        }},
                        {field: 'building', title: __('Building'), visible: false, formatter: function (building) {
                          if(building) {
                              return building.name;
                          }
                          return '';
                        }},
                        {field: 'house', title: __('House'),  formatter: function (house) {
                          if(house) {
                              return house.name;
                          }
                          return '';
                        }},
                        {field: 'status', title: __('Status'), operate: false, formatter: function (value) {
                            var statuses = ['InValid','Valid','Valid1']
                            return Table.api.formatter.status(statuses[value]);
                        }},
                        //{field: 'begin_time', title: __('BeginTime'),formatter: Table.api.formatter.datetime},
                        //{field: 'end_time', title: __('EndTime'),formatter: Table.api.formatter.datetime},
                        {field: 'create_time', title: __('CreateTime'), visible: false, formatter: Table.api.formatter.datetime},
                        {field: 'operate', title: __('Operate'), table: table, events: Table.api.events.operate, formatter: Table.api.formatter.operate}
                    ]
                ]
            });

            // 为表格绑定事件
            Table.api.bindevent(table);
            Controller.api.bindevent();
            $("#common_search").bind("click",function () {
                table.bootstrapTable('refresh',{
                    url: $.fn.bootstrapTable.defaults.extend.index_url,
                    pageNumber: 1
                });
            });
        },
        detail: function () {
            var editor = UE.getEditor('container');
            Controller.api.bindevent();
        },
        add: function () {
            var editor = UE.getEditor('container');
             Controller.handleCommunityState();
            $("#community_code").change();
            $("#building_code").change();
            Controller.api.bindevent();
        },
        edit: function () {
            var editor = UE.getEditor('container');
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
                  url: 'house/index/get_building_by_cm_code',
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
                  url: 'house/index/get_house_by_cm_code',
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
      }
  };
  return Controller;
});