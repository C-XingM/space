<?php

namespace app\admin\controller\auth;

use app\admin\model\AuthGroup;
use app\admin\model\AuthGroupAccess;
use app\common\controller\Backend;
use fast\Random;
use fast\Tree;
use think\Session;

/**
 * 管理员管理
 *
 * @icon fa fa-users
 * @remark 一个管理员可以有多个角色组,左侧的菜单根据管理员所拥有的权限进行生成
 */
class Admin extends Backend
{

    protected $model = null;
    protected $childrenGroupIds = [];
    protected $childrenAdminIds = [];
    protected $communityModel = null;
    //检索时匹配的字段
    protected $searchfields = 'username,nickname,email';

    public function _initialize()
    {
        parent::_initialize();
        $this->model = model('Admin');
        $this->getAdminIds();
        $this->childrenGroupIds = $this->auth->getChildrenGroupIds(true);
        $groupName = AuthGroup::where('id', 'in', $this->childrenGroupIds)
                ->column('id,name');

        $this->view->assign('groupdata', $groupName);
        $this->assignconfig("admin", ['id' => $this->auth->id]);
        $this->communityModel = model('Community');
        $this->view->assign('community',$this->communityModel->where(array('code'=>array('in',parent::getCommunityIdByAuth())))->field('code,name')->select());
    }

     
    /**
     * 查看
     */
    public function index()
    {
        if ($this->request->isAjax())
        {

            //$childrenGroupIds = $this->auth->getChildrenAdminIds(true);
            $childrenGroupIds = $this->auth->getChildrenGroupIds(true);
            $groupName = AuthGroup::where('id', 'in', $childrenGroupIds)
                    ->column('id,name');
            $authGroupList = AuthGroupAccess::where('group_id', 'in', $childrenGroupIds)
                    ->field('uid,group_id')
                    ->select();

            $adminGroupName = [];
            foreach ($authGroupList as $k => $v)
            {
                if (isset($groupName[$v['group_id']]))
                $adminGroupName[$v['uid']][$v['group_id']] = $groupName[$v['group_id']];
            }
            $this->buildCommonSearch();
            list($where, $sort, $order, $offset, $limit) = $this->buildparams($this->searchfields);
            $total = $this->model
                    ->where($where)
                    ->where('id', 'in', $this->childrenAdminIds)
                    ->order($sort, $order)
                    ->count();

            $list = $this->model
                    ->where($where)
                    ->where('id', 'in', $this->childrenAdminIds)
                    ->field(['password', 'salt', 'token'], true)
                    ->order($sort, $order)
                    ->limit($offset, $limit)
                    ->select();
            foreach ($list as $k => &$v)
            {
                $groups = isset($adminGroupName[$v['id']]) ? $adminGroupName[$v['id']] : [];
                $v['groups'] = implode(',', array_keys($groups));
                $v['groups_text'] = implode(',', array_values($groups));
            }
            unset($v);
            $result = array("total" => $total, "rows" => $list);

            return json($result);
        }
        return $this->view->fetch();
    }

    /**
     * 添加
     */
    public function add()
    {
        if ($this->request->isPost())
        {
            $params = $this->request->post("row/a");
            if ($params)
            {
                $params['salt'] = Random::alnum();
                $params['password'] = md5(md5($params['password']) . $params['salt']);
                $params['avatar'] = '/assets/img/avatar.png'; //设置新管理员默认头像。
                if ($this->model->checkExists('username',$params['username']) !== false) {
                    $this->error('该用户已存在');
                }

                $admin = $this->model->create($params);
                $this->addCommunity($admin->id);
                $group = $this->request->post("group/a");

                //过滤不允许的组别,避免越权
                $group = array_intersect($this->childrenGroupIds, $group);
                $dataset = [];
                foreach ($group as $value)
                {
                    $dataset[] = ['uid' => $admin->id, 'group_id' => $value];
                }
                model('AuthGroupAccess')->saveAll($dataset);
                $this->success();
            }
            $this->error();
        }
        return $this->view->fetch();
    }

    /**
     * 编辑
     */
    public function edit($ids = NULL)
    {
        $row = $this->model->get(['id' => $ids]);
        if (!$row)
            $this->error(__('No Results were found'));
        if ($this->request->isPost())
        {
            $params = $this->request->post("row/a");
            if ($params)
            {
                if ($params['password'])
                {
                    $params['salt'] = Random::alnum();
                    $params['password'] = md5(md5($params['password']) . $params['salt']);
                }
                else
                {
                    unset($params['password'], $params['salt']);
                }

                if ($this->model->checkExists('username',$params['username'],$ids) !== false) {
                    $this->error('该用户已存在');
                }

                $row->save($params);
                $this->updateCommunity($row->id);

                // 先移除所有权限
                model('AuthGroupAccess')->where('uid', $row->id)->delete();

                $group = $this->request->post("group/a");

                // 过滤不允许的组别,避免越权
                $group = array_intersect($this->childrenGroupIds, $group);

                $dataset = [];
                foreach ($group as $value)
                {
                    $dataset[] = ['uid' => $row->id, 'group_id' => $value];
                }
                model('AuthGroupAccess')->saveAll($dataset);
                $this->success();
            }
            $this->error();
        }
        $grouplist = $this->auth->getGroups($row['id']);
        $groupids = [];
        foreach ($grouplist as $k => $v)
        {
            $groupids[] = $v['id'];
        }
        $this->view->assign("row", $row);
        $this->view->assign("groupids", $groupids);
        $this->view->assign('selectedCommunity',model('CommunityAdmin')->getCodeByAdminId($ids));
        return $this->view->fetch();
    }

    /**
     * 删除
     */
    public function del($ids = "")
    {
        if ($ids)
        {
            // 避免越权删除管理员
            $childrenGroupIds = $this->childrenGroupIds;
            $adminList = $this->model->where('id', 'in', $ids)->where('id', 'in', function($query) use($childrenGroupIds) {
                        $query->name('auth_group_access')->where('group_id', 'in', $childrenGroupIds)->field('uid');
                    })->select();
            if ($adminList)
            {
                $deleteIds = [];
                foreach ($adminList as $k => $v)
                {
                    $deleteIds[] = $v->id;
                }
                $deleteIds = array_diff($deleteIds, [$this->auth->id]);
                if ($deleteIds)
                {
                    $this->model->destroy($deleteIds);
                    model('AuthGroupAccess')->where('uid', 'in', $deleteIds)->delete();
                    $this->success();
                }
            }
        }
        $this->error();
    }

    /**
     * 批量更新
     * @internal
     */
    public function multi($ids = "")
    {
        // 管理员禁止批量操作
        $this->error();
    }

    /**
     * 自定义搜索
     * @return array
     */
    protected function buildCommonSearch() {
        $where = array();
        $searchs = $this->request->request('query/a');
        if ($searchs['community_code']) {
            $adminIds = model('CommunityAdmin')->getAdmins($searchs['community_code']);
            $this->childrenAdminIds = array_intersect($adminIds,$this->childrenAdminIds);
        }
    }

    protected function getAdminIds() {
        $admin = Session::get('admin');
        if($admin) {
            $userInfo = json_decode($admin,true);
            $this->childrenAdminIds = $this->auth->getChildrenAdminIds(true);
            if ($this->auth->checkIsSuperAdmin($userInfo['id']) === false) {
                $adminIds = model('CommunityAdmin')->getAdmins(parent::getCommunityIdByAuth());
                $this->childrenAdminIds = array_intersect($adminIds,$this->childrenAdminIds);
            }
        }
    }

    protected function addCommunity($id) {
        model('CommunityAdmin')->addCommunity($this->request->post('community_code/a'),$id);
    }

    protected function updateCommunity($id) {
        model('CommunityAdmin')->updateCommunity($this->request->post('community_code/a'),$id);
    }

}
