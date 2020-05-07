define(['jquery', 'bootstrap', 'backend', 'table', 'form', 'baidueditor'], function ($, undefined, Backend, Table, Form, UE) {

    var Controller = {
        index: function () {
            // 初始化表格参数配置
            Table.api.init({
                extend: {
                    index_url: 'service/complain',
                    add_url: 'service/complain/add',
                    edit_url: 'service/complain/edit',
                    del_url: 'service/complain/del',
                    detail_url: 'service/complain/detail',
                    table: 'service',
                    //设置不同操作下的弹窗宽高
                    area: {
                        add:['800px','400px'],
                        edit:['800px','400px'],
                        detail:['800px','400px']
                    }
                }
            });

            var table = $("#table");

            // 初始化表格
            table.bootstrapTable({
                url: $.fn.bootstrapTable.defaults.extend.index_url,
                escape: false,
                pk: 'id',
                sortName: 'is_readswitch,create_time',
                sortOrder: 'asc,desc',
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
                        {field: 'admin', title: __('Admin'), formatter: function (admin) {
                          if(admin) {
                              return admin.nickname+"("+admin.username+")";
                          }
                          return '';
                        }},
                        {field: 'community', title: __('Community'), formatter: function (community) {
                            if(community) {
                                return community.name;
                            }
                            return '';
                        }},
                        {field: 'reason', title: __('Reason'), 
                          cellStyle: function (value, row, index) {
                            return {
                                css: {
                                    "min-width": "100px",
                                    "white-space": "nowrap",
                                    "text-overflow": "ellipsis",
                                    "overflow": "hidden",
                                    "max-width": "200px"
                                }
                            }
                          },
                          formatter: function (value, row, index) {
                              //return "" + value + "";
                              var span=document.createElement("span");
                              span.setAttribute("title",value);
                              span.innerHTML = value;
                              return span.outerHTML;
                          },
                          operate: false},
                        {field: 'is_readswitch', title: __('IsReadswitch'), 
                          operate: false, 
                          formatter: function (value) {
                              var types = ['NoAnonymity','Anonymity'];
                              return Table.api.formatter.status(types[value]);
                          }
                          //formatter: Table.api.formatter.toggle
                        },
                        {field: 'create_time', title: __('CreateTime'),formatter: Table.api.formatter.datetime},
                        {field: 'operate', title: __('Operate'), table: table, events: Table.api.events.operate, formatter: Table.api.formatter.operate}
                    ]
                ],
                search: false
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
            //   $(document).on('click', "input[name='row[is_readswitch]']", function () {
            //     var name = $("input[name='row[name]']");
            //     name.prop("placeholder", $(this).val() == 1 ? name.data("placeholder-menu") : name.data("placeholder-node"));
            // });
            // $("input[name='row[is_readswitch]']:checked").trigger("click");
            Form.api.bindevent($("form[role=form]"));
                // Form.api.bindevent($("form[role=form]"));
            }
        }
    };
    return Controller;
});