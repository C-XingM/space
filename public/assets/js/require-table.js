define(['jquery', 'bootstrap', 'moment', 'moment/locale/zh-cn', 'bootstrap-table', 'bootstrap-table-lang', 'bootstrap-table-mobile', 'bootstrap-table-export', 'bootstrap-table-commonsearch', 'bootstrap-table-template'], function ($, undefined, Moment) {
    var Table = {
        list: {},
        // Bootstrap-table 基础配置
        defaults: {
            url: '',
            sidePagination: 'server',
            method: 'get',
            toolbar: "#toolbar",
            search: true,
            cache: false,
            commonSearch: true,
            searchFormVisible: false,
            titleForm: '', //为空则不显示标题，不定义默认显示：普通搜索
            idTable: 'commonTable',
            showExport: true,
            exportDataType: "all",
            //exportTypes: ['json', 'xml', 'csv', 'txt', 'doc', 'excel'],
            exportTypes: ['json', 'xml', 'csv', 'txt', 'doc', 'excel'],
            pageSize: 10,
            pageList: [10, 25, 50, 'All'],
            pagination: true,
            clickToSelect: true,
            showRefresh: false,
            locale: 'zh-CN',
            showToggle: true,
            showColumns: true,
            pk: 'id',
            sortName: 'id',
            sortOrder: 'desc',
            paginationFirstText: __("First"),
            paginationPreText: __("Previous"),
            paginationNextText: __("Next"),
            paginationLastText: __("Last"),
            mobileResponsive: true,
            cardView: true,
            checkOnInit: true,
            escape: true,
            extend: {
                index_url: '',
                add_url: '',
                edit_url: '',
                del_url: '',
                multi_url: '',
                dragsort_url: 'ajax/weigh',
            }
        },
        // Bootstrap-table 列配置
        columnDefaults: {
            align: 'center',
            valign: 'middle',
        },
        config: {
            firsttd: 'tbody tr td:first-child:not(:has(div.card-views))',
            toolbar: '.toolbar',
            refreshbtn: '.btn-refresh',
            addbtn: '.btn-add',
            editbtn: '.btn-edit',
            delbtn: '.btn-del',
            multibtn: '.btn-multi',
            disabledbtn: '.btn-disabled',
            editonebtn: '.btn-editone',
            dragsortfield: 'weigh',
        },
        api: {
            init: function (defaults, columnDefaults, locales) {
                defaults = defaults ? defaults : {};
                columnDefaults = columnDefaults ? columnDefaults : {};
                locales = locales ? locales : {};
                // 写入bootstrap-table默认配置
                $.extend(true, $.fn.bootstrapTable.defaults, Table.defaults, defaults);
                // 写入bootstrap-table column配置
                $.extend($.fn.bootstrapTable.columnDefaults, Table.columnDefaults, columnDefaults);
                // 写入bootstrap-table locale配置
                $.extend($.fn.bootstrapTable.locales[Table.defaults.locale], {
                    formatCommonSearch: function () {
                        return __('Common search');
                    },
                    formatCommonSubmitButton: function () {
                        return __('Submit');
                    },
                    formatCommonResetButton: function () {
                        return __('Reset');
                    },
                    formatCommonCloseButton: function () {
                        return __('Close');
                    },
                    formatCommonChoose: function () {
                        return __('Choose');
                    }
                }, locales);
            },
            // 绑定事件
            bindevent: function (table) {
                //Bootstrap-table的父元素,包含table,toolbar,pagnation
                var parenttable = table.closest('.bootstrap-table');
                //Bootstrap-table配置
                var options = table.bootstrapTable('getOptions');
                //Bootstrap操作区
                var toolbar = $(options.toolbar, parenttable);
                //当刷新表格时
                table.on('load-error.bs.table', function (status, res) {
                    Toastr.error(__('Unknown data format'));
                });
                //当刷新表格时
                table.on('refresh.bs.table', function (e, settings, data) {
                    $(Table.config.refreshbtn, toolbar).find(".fa").addClass("fa-spin");
                });
                //当双击单元格时
                table.on('dbl-click-row.bs.table', function (e, row, element, field) {
                    $(Table.config.editonebtn, element).trigger("click");
                });
                //当内容渲染完成后
                table.on('post-body.bs.table', function (e, settings, json, xhr) {
                    $(Table.config.refreshbtn, toolbar).find(".fa").removeClass("fa-spin");
                    $(Table.config.disabledbtn, toolbar).toggleClass('disabled', true);
                    if ($(Table.config.firsttd, table).find("input[type='checkbox'][data-index]").size() > 0) {
                        // 挺拽选择,需要重新绑定事件
                        require(['drag', 'drop'], function () {
                            $(Table.config.firsttd, table).drag("start", function (ev, dd) {
                                return $('<div class="selection" />').css('opacity', .65).appendTo(document.body);
                            }).drag(function (ev, dd) {
                                $(dd.proxy).css({
                                    top: Math.min(ev.pageY, dd.startY),
                                    left: Math.min(ev.pageX, dd.startX),
                                    height: Math.abs(ev.pageY - dd.startY),
                                    width: Math.abs(ev.pageX - dd.startX)
                                });
                            }).drag("end", function (ev, dd) {
                                $(dd.proxy).remove();
                            });
                            $(Table.config.firsttd, table).drop("start", function () {
                                Table.api.toggleattr(this);
                            }).drop(function () {
                                Table.api.toggleattr(this);
                            }).drop("end", function () {
                                Table.api.toggleattr(this);
                            });
                            $.drop({
                                multi: true
                            });
                        });
                    }
                });
                // 处理选中筛选框后按钮的状态统一变更
                table.on('check.bs.table uncheck.bs.table check-all.bs.table uncheck-all.bs.table fa.event.check', function () {
                    var ids = Table.api.selectedids(table);
                    $(Table.config.disabledbtn, toolbar).toggleClass('disabled', !ids.length);
                });
                // 刷新按钮事件
                $(toolbar).on('click', Table.config.refreshbtn, function () {
                    table.bootstrapTable('refresh');
                });
                // 添加按钮事件
                $(toolbar).on('click', Table.config.addbtn, function () {
                    var ids = Table.api.selectedids(table);
                    if(options.extend.area && options.extend.area.add){
                        $(this).data("area",options.extend.area.add);
                    }
                    Fast.api.open(options.extend.add_url + (ids.length > 0 ? (options.extend.add_url.match(/(\?|&)+/) ? "&ids=" : "/ids/") + ids.join(",") : ''), __('Add'), $(this).data() || {});
                });
                // 批量编辑按钮事件
                $(toolbar).on('click', Table.config.editbtn, function () {
                    var ids = Table.api.selectedids(table);
                    var that = this;
                    //循环弹出多个编辑框
                    $.each(ids, function (i, j) {
                        if(options.extend.area && options.extend.area.edit){
                            $(that).data("area",options.extend.area.edit);
                        }
                        Fast.api.open(options.extend.edit_url + (options.extend.edit_url.match(/(\?|&)+/) ? "&ids=" : "/ids/") + j, __('Edit'), $(that).data() || {});
                    });
                });
                // 批量操作按钮事件
                $(toolbar).on('click', Table.config.multibtn, function () {
                    var ids = Table.api.selectedids(table);
                    Table.api.multi($(this).data("action"), ids, table, this);
                });
                // 批量删除按钮事件
                $(toolbar).on('click', Table.config.delbtn, function () {
                    var that = this;
                    var ids = Table.api.selectedids(table);
                    var index = Layer.confirm(
                            __('Are you sure you want to delete the %s selected item?', ids.length),
                            {icon: 3, title: __('Warning'), offset: 0, shadeClose: true},
                            function () {
                                Table.api.multi("del", ids, table, that);
                                Layer.close(index);
                            }
                    );
                });
                // 拖拽排序
                require(['dragsort'], function () {
                    //绑定拖动排序
                    $("tbody", table).dragsort({
                        itemSelector: 'tr',
                        dragSelector: "a.btn-dragsort",
                        dragEnd: function () {
                            var data = table.bootstrapTable('getData');
                            var current = data[parseInt($(this).data("index"))];
                            var options = table.bootstrapTable('getOptions');
                            //改变的值和改变的ID集合
                            var ids = $.map($("tbody tr:visible", table), function (tr) {
                                return data[parseInt($(tr).data("index"))][options.pk];
                            });
                            var changeid = current[options.pk];
                            var pid = typeof current.pid != 'undefined' ? current.pid : '';
                            var params = {
                                url: table.bootstrapTable('getOptions').extend.dragsort_url,
                                data: {
                                    ids: ids.join(','),
                                    changeid: changeid,
                                    pid: pid,
                                    field: Table.config.dragsortfield,
                                    orderway: options.sortOrder,
                                    table: options.extend.table
                                }
                            };
                            Fast.api.ajax(params, function (data) {
                                table.bootstrapTable('refresh');
                            });
                        },
                        placeHolderTemplate: ""
                    });
                });
                $(table).on("click", "input[data-id][name='checkbox']", function (e) {
                    table.trigger('fa.event.check');
                });
                $(table).on("click", "[data-id].btn-change", function (e) {
                    e.preventDefault();
                    Table.api.multi($(this).data("action") ? $(this).data("action") : '', [$(this).data("id")], table, this);
                });
                $(table).on("click", "[data-id].btn-edit", function (e) {
                    e.preventDefault();
                    if(options.extend.area && options.extend.area.edit){
                        $(this).data("area",options.extend.area.edit);
                    }
                    Fast.api.open(options.extend.edit_url + (options.extend.edit_url.match(/(\?|&)+/) ? "&ids=" : "/ids/") + $(this).data("id"), __('Edit'), $(this).data() || {});
                });
                $(table).on("click", "[data-id].btn-del", function (e) {
                    e.preventDefault();
                    var id = $(this).data("id");
                    var that = this;
                    var index = Layer.confirm(
                            __('Are you sure you want to delete this item?'),
                            {icon: 3, title: __('Warning'), shadeClose: true},
                            function () {
                                Table.api.multi("del", id, table, that);
                                Layer.close(index);
                            }
                    );
                });
                var id = table.attr("id");
                Table.list[id] = table;
                return table;
            },
            // 批量操作请求
            multi: function (action, ids, table, element) {
                var options = table.bootstrapTable('getOptions');
                var data = element ? $(element).data() : {};
                var url = typeof data.url !== "undefined" ? data.url : (action == "del" ? options.extend.del_url : options.extend.multi_url);
                url = url + (url.match(/(\?|&)+/) ? "&ids=" : "/ids/") + ($.isArray(ids) ? ids.join(",") : ids);
                var params = typeof data.params !== "undefined" ? (typeof data.params == 'object' ? $.param(data.params) : data.params) : '';
                var options = {url: url, data: {action: action, ids: ids, params: params}};
                Fast.api.ajax(options, function (data) {
                    table.bootstrapTable('refresh');
                });
            },
            // 单元格元素事件
            events: {
                operate: {
                    'click .btn-detailone': function (e, value, row, index) {
                        e.stopPropagation();
                        var options = $(this).closest('table').bootstrapTable('getOptions');
                        if(options.extend.area && options.extend.area.detail){
                            $(this).data("area",options.extend.area.detail);
                        }
                        Fast.api.open(options.extend.detail_url + (options.extend.detail_url.match(/(\?|&)+/) ? "&ids=" : "/ids/") + row[options.pk], __('Detail'), $(this).data() || {});
                    },
                    'click .btn-editone': function (e, value, row, index) {
                        e.stopPropagation();
                        var options = $(this).closest('table').bootstrapTable('getOptions');
                        if(options.extend.area && options.extend.area.edit){
                            $(this).data("area",options.extend.area.edit);
                        }
                        Fast.api.open(options.extend.edit_url + (options.extend.edit_url.match(/(\?|&)+/) ? "&ids=" : "/ids/") + row[options.pk], __('Edit'), $(this).data() || {});
                    },
                    'click .btn-delone': function (e, value, row, index) {
                        e.stopPropagation();
                        var that = this;
                        var top = $(that).offset().top - $(window).scrollTop();
                        var left = $(that).offset().left - $(window).scrollLeft() - 260;
                        if (top + 154 > $(window).height()) {
                            top = top - 154;
                        }
                        if ($(window).width() < 480) {
                            top = left = undefined;
                        }
                        var index = Layer.confirm(
                                __('Are you sure you want to delete this item?'),
                                {icon: 3, title: __('Warning'), offset: [top, left], shadeClose: true},
                                function () {
                                    var table = $(that).closest('table');
                                    var options = table.bootstrapTable('getOptions');
                                    Table.api.multi("del", row[options.pk], table, that);
                                    Layer.close(index);
                                }
                        );
                    }
                }
            },
            // 单元格数据格式化
            formatter: {
                icon: function (value, row, index) {
                    if (!value)
                        return '';
                    value = value.indexOf(" ") > -1 ? value : "fa fa-" + value;
                    //渲染fontawesome图标
                    return '<i class="' + value + '"></i> ' + value;
                },
                image: function (value, row, index) {
                    value=value?value:'/assets/img/blank.gif';
                    var classname = typeof this.classname !== 'undefined' ? this.classname : 'img-sm img-center';
                    return '<img class="' + classname + '" src="' + Fast.api.cdnurl(value) + '" />';
                },
                images: function (value, row, index) {
                    value = value.toString();
                    var classname = typeof this.classname !== 'undefined' ? this.classname : 'img-sm img-center';
                    var arr = value.split(',');
                    var html = [];
                    $.each(arr, function (i, value) {
                        value=value?value:'/assets/img/blank.gif';
                        html.push('<img class="' + classname + '" src="' + Fast.api.cdnurl(value) + '" />');
                    });
                    return html.join(' ');
                },
                status: function (value, row, index) {
                    //颜色状态数组,可使用red/yellow/aqua/blue/navy/teal/olive/lime/fuchsia/purple/maroon
                    var colorArr = {
                        normal: 'success',
                        Using: 'success',
                        Sale: 'success',
                        Valid: 'success',
                        Valid1: 'grey',
                        NoAnonymity: 'danger',
                        Anonymity: 'success',
                        UnRead: 'grey',
                        Read: 'success',
                        Lease: 'danger',
                        Idling: 'grey',
                        InValid: 'danger',
                        Pending: 'danger',
                        Handling: 'success',
                        Solved: 'info',
                        hidden: 'grey',
                        deleted: 'danger',
                        locked: 'info',
                        Teaching: 'blue',
                        Recreational: 'yellow',
                        Others: 'aqua'
                    };
                    //如果字段列有定义custom
                    if (typeof this.custom !== 'undefined') {
                        colorArr = $.extend(colorArr, this.custom);
                    }
                    value = value.toString();
                    var color = value && typeof colorArr[value] !== 'undefined' ? colorArr[value] : 'primary';
                    value = value.charAt(0).toUpperCase() + value.slice(1);
                    //渲染状态
                    var html = '<span class="text-' + color + '"><i class="fa fa-circle"></i> ' + __(value) + '</span>';
                    return html;
                },
                types: function (value, row, index) {
                  //颜色状态数组,可使用red/yellow/aqua/blue/navy/teal/olive/lime/fuchsia/purple/maroon
                  var colorArr = {
                      Teaching: 'blue',
                      Recreational: 'yellow',
                      Others: 'aqua'
                  };
                  //如果字段列有定义custom
                  if (typeof this.custom !== 'undefined') {
                      colorArr = $.extend(colorArr, this.custom);
                  }
                  value = value.toString();
                  var color = value && typeof colorArr[value] !== 'undefined' ? colorArr[value] : 'primary';
                  value = value.charAt(0).toUpperCase() + value.slice(1);
                  //渲染状态
                  var html = '<span class="text-' + color + '">' + __(value) + '</span>';
                  return html;
              },
              toggle: function (value, row, index) {
                var table = this.table;
                var options = table ? table.bootstrapTable('getOptions') : {};
                var pk = options.pk || "id";
                var color = typeof this.color !== 'undefined' ? this.color : 'success';
                var yes = typeof this.yes !== 'undefined' ? this.yes : 1;
                var no = typeof this.no !== 'undefined' ? this.no : 0;
                var url = typeof this.url !== 'undefined' ? this.url : '';
                var disable = false;
                if (typeof this.disable !== "undefined") {
                    disable = typeof this.disable === "function" ? this.disable.call(this, value, row, index) : this.disable;
                }
                return "<a href='javascript:;' data-toggle='tooltip' title='" + __('Click to toggle') + "' class='btn-change " + (disable ? 'btn disabled' : '') + "' data-id='"
                    + row[pk] + "' " + (url ? "data-url='" + url + "'" : "") + " data-params='" + this.field + "=" + (value == yes ? no : yes) + "'><i class='fa fa-toggle-on " + (value == yes ? 'text-' + color : 'fa-flip-horizontal text-gray') + " fa-2x'></i></a>";
            },
                url: function (value, row, index) {
                    return '<div class="input-group input-group-sm" style="width:250px;"><input type="text" class="form-control input-sm" value="' + value + '"><span class="input-group-btn input-group-sm"><a href="' + value + '" target="_blank" class="btn btn-default btn-sm"><i class="fa fa-link"></i></a></span></div>';
                },
                search: function (value, row, index) {
                    return '<a href="javascript:;" class="searchit" data-field="' + this.field + '" data-value="' + value + '">' + value + '</a>';
                },
                addtabs: function (value, row, index) {
                    var url = Table.api.replaceurl(this.url, value, row, this.table);
                    var title = this.atitle ? this.atitle : __("Search %s", value);
                    return '<a href="' + Fast.api.fixurl(url) + '" class="addtabsit" data-value="' + value + '" title="' + title + '">' + value + '</a>';
                },
                dialog: function (value, row, index) {
                    var url = Table.api.replaceurl(this.url, value, row, this.table);
                    var title = this.atitle ? this.atitle : __("View %s", value);
                    return '<a href="' + Fast.api.fixurl(url) + '" class="dialogit" data-value="' + value + '" title="' + title + '">' + value + '</a>';
                },
                flag: function (value, row, index) {
                    var colorArr = {index: 'success', hot: 'warning', recommend: 'danger', 'new': 'info'};
                    //如果字段列有定义custom
                    if (typeof this.custom !== 'undefined') {
                        colorArr = $.extend(colorArr, this.custom);
                    }
                    //渲染Flag
                    var html = [];
                    var arr = value.split(',');
                    $.each(arr, function (i, value) {
                        value = value.toString();
                        if (value == '')
                            return true;
                        var color = value && typeof colorArr[value] !== 'undefined' ? colorArr[value] : 'primary';
                        value = value.charAt(0).toUpperCase() + value.slice(1);
                        html.push('<span class="label label-' + color + '">' + __(value) + '</span>');
                    });
                    return html.join(' ');
                },
                label: function (value, row, index) {
                    return Table.api.formatter.flag.call(this, value, row, index);
                },
                date: function (value, row, index) {
                    return value ? Moment(parseInt(value) * 1000).format("YYYY-MM-DD") : __('None');
                },
                datetime: function (value, row, index) {
                    return value ? Moment(parseInt(value) * 1000).format("YYYY-MM-DD HH:mm:ss") : __('None');
                },
                amount: function (value, row, index) {
                    return value && (value
                        .toString().indexOf('.') != -1 ? value.toString().replace(/(\d)(?=(\d{3})+\.)/g, function($0, $1) {
                        return $1 + ",";
                    }) : value.toString().replace(/(\d)(?=(\d{3}))/g, function($0, $1) {
                        return $1 + ",";
                    }));
                },
                operate: function (value, row, index) {
                    var table = this.table;
                    // 操作配置
                    var options = table ? table.bootstrapTable('getOptions') : {};
                    // 默认按钮组
                    var buttons = $.extend([], this.buttons || []);
                    buttons.push({name: 'dragsort', icon: 'fa fa-arrows', classname: 'btn btn-xs btn-primary btn-dragsort'});
                    buttons.push({name: 'detail', icon: 'fa fa-eye', classname: 'btn btn-xs btn-primary btn-detailone'});
                    buttons.push({name: 'edit', icon: 'fa fa-pencil', classname: 'btn btn-xs btn-success btn-editone'});
                    buttons.push({name: 'del', icon: 'fa fa-trash', classname: 'btn btn-xs btn-danger btn-delone'});
                    var html = [];
                    var url, classname, icon, text, title, extend;
                    $.each(buttons, function (i, j) {
                        if (j.name === 'dragsort' && typeof row[Table.config.dragsortfield] === 'undefined') {
                            return true;
                        }
                        if (['detail','add', 'edit', 'del', 'multi', 'dragsort'].indexOf(j.name) > -1 && !options.extend[j.name + "_url"]) {
                            return true;
                        }
                        var attr = table.data("operate-" + j.name);
                        if (typeof attr === 'undefined' || attr) {
                            url = j.url ? j.url : '';
                            if (url.indexOf("{ids}") === -1) {
                                url = url ? url + (url.match(/(\?|&)+/) ? "&ids=" : "/ids/") + row[options.pk] : '';
                            }
                            url = Table.api.replaceurl(url, value, row, table);
                            url = url ? Fast.api.fixurl(url) : 'javascript:;';
                            classname = j.classname ? j.classname : 'btn-primary btn-' + name + 'one';
                            icon = j.icon ? j.icon : '';
                            text = j.text ? j.text : '';
                            title = j.title ? j.title : text;
                            extend = j.extend ? j.extend : '';
                            html.push('<a href="' + url + '" class="' + classname + '" ' + extend + ' title="' + title + '"><i class="' + icon + '"></i>' + (text ? ' ' + text : '') + '</a>');
                        }
                    });
                    return html.join(' ');
                },
                buttons: function (value, row, index) {
                    var table = this.table;
                    // 操作配置
                    var options = table ? table.bootstrapTable('getOptions') : {};
                    // 默认按钮组
                    var buttons = $.extend([], this.buttons || []);
                    var html = [];
                    var url, classname, icon, text, title, extend;
                    $.each(buttons, function (i, j) {
                        var attr = table.data("buttons-" + j.name);
                        if (typeof attr === 'undefined' || attr) {
                            url = j.url ? j.url : '';
                            if (url.indexOf("{ids}") === -1) {
                                url = url ? url + (url.match(/(\?|&)+/) ? "&ids=" : "/ids/") + row[options.pk] : '';
                            }
                            url = Table.api.replaceurl(url, value, row, table);
                            url = url ? Fast.api.fixurl(url) : 'javascript:;';
                            classname = j.classname ? j.classname : 'btn-primary btn-' + name + 'one';
                            icon = j.icon ? j.icon : '';
                            text = j.text ? j.text : '';
                            title = j.title ? j.title : text;
                            extend = j.extend ? j.extend : '';
                            html.push('<a href="' + url + '" class="' + classname + '" ' + extend + ' title="' + title + '"><i class="' + icon + '"></i>' + (text ? ' ' + text : '') + '</a>');
                        }
                    });
                    return html.join(' ');
                }
            },
            //替换URL中的{ids}和{value}
            replaceurl: function (url, value, row, table) {
                url = url ? url : '';
                url = url.replace(/\{value\}/ig, value);
                if (table) {
                    var options = table.bootstrapTable('getOptions');
                    url = url.replace(/\{ids\}/ig, row[options.pk]);
                } else {
                    url = url.replace(/\{ids\}/ig, 0);
                }
                return url;
            },
            // 获取选中的条目ID集合
            selectedids: function (table) {
                var options = table.bootstrapTable('getOptions');
                if (options.templateView) {
                    return $.map($("input[data-id][name='checkbox']:checked"), function (dom) {
                        return $(dom).data("id");
                    });
                } else {
                    return $.map(table.bootstrapTable('getSelections'), function (row) {
                        return row[options.pk];
                    });
                }
            },
            // 切换复选框状态
            toggleattr: function (table) {
                $("input[type='checkbox']", table).trigger('click');
            }
        },
    };
    return Table;
});
