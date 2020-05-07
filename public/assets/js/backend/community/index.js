/* 校区管理 */
define(['jquery', 'bootstrap', 'backend', 'table', 'form', 'baidueditor'], function ($, undefined, Backend, Table, Form, UE) {

    var Controller = {
        index: function () {
            // 初始化表格参数配置
            Table.api.init({
                extend: {
                    index_url: 'community/index',
                    detail_url: 'community/index/detail',
                    add_url: 'community/index/add',
                    edit_url: 'community/index/edit',
                    del_url: 'community/index/del',
                    table: 'community',
                    //设置不同操作下的弹窗宽高
                    area: {
                      detail:['800px','420px']
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
                pageSize: 10,
                commonSearch: false,
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
                        {field: 'thumb', title: __('Thumb'), operate: false, formatter: Table.api.formatter.image},
                        {field: 'code', title: __('Code'), operate: false},
                        {field: 'name', title: __('Name'), operate: false},
                        {field: 'address', title: __('Address'), operate: false},
                        {field: 'create_time', title: __('CreateTime'),formatter: Table.api.formatter.datetime},
                        {field: 'operate', title: __('Operate'), table: table, events: Table.api.events.operate, formatter: Table.api.formatter.operate}
                    ]
                ]
            });

            // 为表格绑定事件
            Table.api.bindevent(table);
        },
        detail: function () {
            var editor = UE.getEditor('container');
            Controller.api.bindevent();
        },
        add: function () {
            var editor = UE.getEditor('container');
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
        }
    };
    return Controller;
});