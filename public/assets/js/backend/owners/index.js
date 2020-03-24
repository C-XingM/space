define(['jquery', 'bootstrap', 'backend', 'table', 'form', 'baidueditor'], function ($, undefined, Backend, Table, Form, UE) {

    /* var Controller = {
        index: function () {
            // 初始化表格参数配置
            Table.api.init({
                extend: {
                    index_url: 'owners/index',
                    add_url: 'owners/index/add',
                    edit_url: 'owners/index/edit',
                    del_url: 'owners/index/del',
                    table: 'owners'
                }
            });

            var table = $("#table");

            // 初始化表格
            table.bootstrapTable({
                url: $.fn.bootstrapTable.defaults.extend.index_url,
                escape: false,
                pk: 'id',
                sortName: 'community_code,name',
                sortOrder: 'asc,asc',
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
                        {field: 'id', title: __('Id')},
                        {field: 'photo', title: __('Photo'), operate: false, formatter: Table.api.formatter.image},
                        {field: 'community', title: __('Community'), formatter: function (community) {
                            if(community) {
                                return community.name;
                            }
                            return '';
                        }},
                        {field: 'house', title: __('House'),  formatter: function (house) {
                            if(house) {
                                return house.name;
                            }
                            return '';
                        }},
                        {field: 'name', title: __('Name'), operate: false},
                        {field: 'identity_id', title: __('Identity'), operate: false},
                        {field: 'tel', title: __('Tel'), operate: false},
                        {field: 'occupation', title: __('Occupation'), operate: false},
                        {field: 'birth', title: __('Birth'), operate: false},
                        {field: 'gender', title: __('Gender'), operate: false,formatter: function (value) {
                            var genders = [__('Women'),__('Man')];
                            return genders[value];
                        }},
                        {field: 'owner_type', title: __('OwnerType'), operate: false,formatter: function (value) {
                            var ownerTypes = ['',__('Owner'),__('Member'),__('Lessee')];
                            return ownerTypes[value];
                        }},
                        {field: 'remark', title: __('Remark'),operate: false},
                        {field: 'create_time', title: __('CreateTime'),formatter: Table.api.formatter.datetime},
                        {field: 'operate', title: __('Operate'), table: table, events: Table.api.events.operate, formatter: Table.api.formatter.operate}
                    ]
                ]
            }); */

            var Controller = {
              index: function () {
                  // 初始化表格参数配置
                  Table.api.init({
                      extend: {
                          index_url: 'service/activity',//'house/index',
                          add_url: 'house/index/add',
                          edit_url: 'house/index/edit',
                          del_url: 'house/index/del',
                          table: 'house'
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
                              {field: 'id', title: __('Id')},
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
                              {field: 'house', title: __('House'),  formatter: function (house) {
                                if(house) {
                                    return house.name;
                                }
                                return '';
                            }},
                              //{field: 'code', title: __('Code'), operate: false},
                              //{field: 'name', title: __('Name'), operate: false},
                              // {field: 'owner_name', title: __('OwnerName'), operate: false},
                              // {field: 'owner_tel', title: __('OwnerTel'), operate: false},
                              // {field: 'rooms', title: __('Rooms'), operate: false},
                              // {field: 'unit', title: __('Unit'), operate: false},
                              // {field: 'floor', title: __('Floor'), operate: false},
                              // {field: 'desc', title: __('Desc'), operate: false},
                              //{field: 'create_time', title: __('CreateTime'),formatter: Table.api.formatter.date},
                              //{field: 'begin_time', title: __('BeginTime'),formatter: Table.api.formatter.datetime},
                              //{field: 'end_time', title: __('EndTime'),formatter: Table.api.formatter.datetime},
                              //{field: 'operate', title: __('Operate'), table: table, events: Table.api.events.operate, formatter: Table.api.formatter.operate}
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
      //   handleCommunityState: function (showAll) {
      //     var building_id = $("#building_id").val();
      //       $("#community_code").bind("change",function(){
      //           var community_code = $(this).val();
      //           $.ajax({
      //               type: "POST",
      //               url: 'owners/index/get_building_by_cm_code',
      //               async: true,
      //               cache: false,
      //               dataType : "json",
      //               data: {community_code:community_code},
      //               success: function(data) {
      //                   var building = data.building;

      //                   var buildingHtml = showAll ? '<option value="">全部</option>' : '';
      //                   $.each(building,function(index,item){
      //                       buildingHtml += '<option value="'+item.code+'">'+item.name+'</option>';
      //                   });
      //                   if(buildingHtml == ''){
      //                       buildingHtml = '<option value="">没有任何选中项</option>';
      //                   }
      //                   $("#building_code").html(buildingHtml);
      //                   if (building_id) {
      //                       $("#building_code").val(building_id);
      //                   }
      //                   $("#building_code").selectpicker({
      //                       showTick:true,
      //                       liveSearch:true
      //                   });
      //                   $("#building_code").selectpicker("refresh");
      //               }
      //           });
      //       });
            
            
      // },
        /* handleCommunityState: function (showAll) {
            var house_id = $("#house_id").val();
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
        } */
    };
    return Controller;
});