define(['jquery', 'bootstrap', 'backend', 'table', 'form', 'baidueditor'], function ($, undefined, Backend, Table, Form, UE) {

    var Controller = {
        index: function () {
            // 初始化表格参数配置
            Table.api.init({
                extend: {
                    index_url: 'service/repair',
                    add_url: 'service/repair/add',
                    edit_url: 'service/repair/edit',
                    del_url: 'service/repair/del',
                    detail_url: 'service/repair/detail',
                    table: 'service',
                    //设置不同操作下的弹窗宽高
                    area: {
                        add:['100%','100%'],
                        edit:['100%','100%'],
                        detail:['100%','100%']
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
                //searchFormVisible: true,
                //search:false,
                commonSearch: false,
                exportDataType: 'selected',
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
                        {field: 'no',title: __('TableID'),operate: false,align: "center",
                          formatter: function (value, row, index) {
                              //获取每页显示的数量
                              var pageSize=$('#table').bootstrapTable('getOptions').pageSize;
                              //获取当前是第几页
                              var pageNumber=$('#table').bootstrapTable('getOptions').pageNumber;
                              //返回序号，注意index是从0开始的，所以要加上1
                              return pageSize * (pageNumber - 1) + index + 1;
                          }
                        },
                        {field: 'admin', title: __('Admin'), formatter: function (admin) {
                          if(admin) {
                              return admin.nickname+"("+admin.username+")";
                          }
                          return '';
                        }},
                        {field: 'author', title: __('Author')},
                        {field: 'device_name', title: __('DeviceName'), //operate: false,
                            cellStyle: function (value, row, index) {
                                  return {
                                      css: {
                                          "max-width": "250px",
                                          "white-space": "nowrap",
                                          "text-overflow": "ellipsis",
                                          "overflow": "hidden"
                                      }
                                  }
                            }
                        },
                        {field: 'create_time', title: __('CreateTime'),operate: false,formatter: Table.api.formatter.datetime},
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
            Controller.api.bindevent();
        },
        add: function () {
            Controller.api.bindevent();
        },
        edit: function () {
            Controller.api.bindevent();
        },
        api: {
            bindevent: function () {
                Form.api.bindevent($("form[role=form]"));
            }
        }
    };
    return Controller;
});