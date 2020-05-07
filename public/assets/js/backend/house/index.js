define(['jquery', 'bootstrap', 'backend', 'table', 'form', 'baidueditor'], function ($, undefined, Backend, Table, Form, UE) {

    var Controller = {
        index: function () {
            // 初始化表格参数配置
            Table.api.init({
                extend: {
                    index_url: 'house/index',
                    add_url: 'house/index/add',
                    edit_url: 'house/index/edit',
                    del_url: 'house/index/del',
                    detail_url: 'house/index/detail',
                    table: 'house',
                    area: {
                      area: {
                        add:['800px','420px'],
                        edit:['800px','420px'],
                        detail:['800px','420px']
                    }
                  }
                }
            });

            var table = $("#table");

            // 初始化表格
            table.bootstrapTable({
                url: $.fn.bootstrapTable.defaults.extend.index_url,
                escape: false,
                pk: 'id',
                sortName: 'community_code,building_code,create_time',
                sortOrder: 'asc,asc,desc',
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
                        {field: 'thumb', title: __('缩略图'), operate: false, formatter: Table.api.formatter.image},
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
                        {field: 'code', title: __('Code'), operate: false},
                        {field: 'name', title: __('Name'), operate: false},
                        {field: 'create_time', title: __('CreateTime'),formatter: Table.api.formatter.date},
                        {field: 'operate', title: __('Operate'), table: table, events: Table.api.events.operate, formatter: Table.api.formatter.operate}
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
            Controller.handleCommunityState();
            $("#community_code").change();
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
        }
    };
    return Controller;
});