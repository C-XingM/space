define(['jquery', 'bootstrap', 'backend', 'table', 'form', 'template'], function ($, undefined, Backend, Table, Form, Template) {

    var Controller = {
        index: function () {
            // 初始化表格参数配置
            Table.api.init({
                extend: {
                    "index_url": "auth/rule/index",
                    "add_url": "auth/rule/add",
                    "edit_url": "auth/rule/edit",
                     "del_url": "auth/rule/del",
                    "multi_url": "auth/rule/multi",
                    "table": "auth_rule",
                    area: {
                      edit:['800px','420px']
                    }
                }
            });

            var table = $("#table");

            // 初始化表格
            table.bootstrapTable({
                url: $.fn.bootstrapTable.defaults.extend.index_url,
                sortName: 'weigh',
                escape:false, 
                showExport: false,
                columns: [
                    [
                        //{field: 'state', checkbox: true, },
                        //{field: 'pid', title: 'ID'},
                        {
                          field: 'no',
                          title: __('序号'),
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
                        {field: 'icon', title: __('Icon'), formatter: Controller.api.formatter.icon},
                        {field: 'title', title: __('菜单名'), align: 'left',  formatter: Controller.api.formatter.title},
              
                        {field: 'name', title: __('路径url'), formatter: Controller.api.formatter.name},
                        // {field: 'weigh', title: __('Weigh')},
                        {field: 'status', title: __('Status'), formatter: Table.api.formatter.status},
                        {field: 'ismenu', title: __('Ismenu'), align: 'center', formatter: Controller.api.formatter.menu},
                        {field: 'id', title: '<a href="javascript:;" class="btn btn-success btn-xs btn-toggle"><i class="fa fa-chevron-up"></i></a>', operate: false, formatter: Controller.api.formatter.subnode},
                        {field: 'operate', title: __('Operate'), table: table, events: Table.api.events.operate, formatter: Table.api.formatter.operate}
                    ]
                ],
                pagination: false,
                search: false,
                commonSearch: false,
            });

            // 为表格绑定事件
            Table.api.bindevent(table);//当内容渲染完成后

            //默认隐藏所有子节点
            table.on('post-body.bs.table', function (e, settings, json, xhr) {
                //$("a.btn[data-id][data-pid][data-pid!=0]").closest("tr").hide();
                $(".btn-node-sub.disabled").closest("tr").hide();

                //显示隐藏子节点
                $(".btn-node-sub").off("click").on("click", function (e) {
                    var status = $(this).data("shown") ? true : false;
                    $("a.btn[data-pid='" + $(this).data("id") + "']").each(function () {
                        $(this).closest("tr").toggle(!status);
                    });
                    $(this).data("shown", !status);
                    return false;
                });

            });
            //展开隐藏一级
            $(document.body).on("click", ".btn-toggle", function (e) {
                $("a.btn[data-id][data-pid][data-pid!=0].disabled").closest("tr").hide();
                var that = this;
                var show = $("i", that).hasClass("fa-chevron-down");
                $("i", that).toggleClass("fa-chevron-down", !show);
                $("i", that).toggleClass("fa-chevron-up", show);
                $("a.btn[data-id][data-pid][data-pid!=0]").not('.disabled').closest("tr").toggle(show);
                $(".btn-node-sub[data-pid=0]").data("shown", show);
            });
            //展开隐藏全部
            $(document.body).on("click", ".btn-toggle-all", function (e) {
                var that = this;
                var show = $("i", that).hasClass("fa-plus");
                $("i", that).toggleClass("fa-plus", !show);
                $("i", that).toggleClass("fa-minus", show);
                $(".btn-node-sub.disabled").closest("tr").toggle(show);
                $(".btn-node-sub").data("shown", show);
            });
        },
        add: function () {
            Controller.api.bindevent();
        },
        edit: function () {
            Controller.api.bindevent();
        },
        api: {
            formatter: {
                title: function (value, row, index) {
                    return !row.ismenu ? "<span class='text-muted'>" + value + "</span>" : value;
                },
                name: function (value, row, index) {
                    return !row.ismenu ? "<span class='text-muted'>" + value + "</span>" : value;
                },
                menu: function (value, row, index) {
                    return "<a href='javascript:;' class='btn btn-" + (value ? "info" : "default") + " btn-xs btn-change' data-id='"
                            + row.id + "' data-params='ismenu=" + (value ? 0 : 1) + "'>" + (value ? __('Yes') : __('No')) + "</a>";
                },
                icon: function (value, row, index) {
                    return '<i class="' + value + '"></i>';
                },
                subnode: function (value, row, index) {
                    return '<a href="javascript:;" data-id="' + row['id'] + '" data-pid="' + row['pid'] + '" class="btn btn-xs '
                            + (row['haschild'] == 1 ? 'btn-success' : 'btn-default disabled') + ' btn-node-sub"><i class="fa fa-sitemap"></i></a>';
                }
            },
            bindevent: function () {
                var iconlist = [];
                Form.api.bindevent($("form[role=form]"));
                $(document).on('click', ".btn-search-icon", function () {
                    if (iconlist.length == 0) {
                        $.get(Config.site.cdnurl + "/assets/libs/font-awesome/less/variables.less", function (ret) {
                            var exp = /fa-var-(.*):/ig;
                            var result;
                            while ((result = exp.exec(ret)) != null) {
                                iconlist.push(result[1]);
                            }
                            Layer.open({
                                type: 1,
                                area: ['460px', '300px'], //宽高
                                content: Template('chooseicontpl', {iconlist: iconlist})
                            });
                        });
                    } else {
                        Layer.open({
                            type: 1,
                            area: ['460px', '300px'], //宽高
                            content: Template('chooseicontpl', {iconlist: iconlist})
                        });
                    }
                });
                $(document).on('click', '#chooseicon ul li', function () {
                    $("input[name='row[icon]']").val('fa fa-' + $(this).data("font"));
                    Layer.closeAll();
                });
                $(document).on('keyup', 'input.js-icon-search', function () {
                    $("#chooseicon ul li").show();
                    if ($(this).val() != '') {
                        $("#chooseicon ul li:not([data-font*='" + $(this).val() + "'])").hide();
                    }
                });
            }
        }
    };
    return Controller;
});