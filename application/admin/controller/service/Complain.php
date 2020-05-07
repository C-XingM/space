<?php
namespace app\admin\controller\service;

use app\common\controller\Backend;
use think\Session;

/**
 * Created by PhpStorm.
 * FileName: Index.php
 * User: Administrator
 * Date: 2017/11/01
 * Time: 13:42
 */

class Complain extends Backend {

    protected $model = null;
    // protected $multiFields="is_readswitch";
    protected $communityModel = null;
    //检索时匹配的字段
    protected $searchfields = 'community_code,reason';
    protected $noNeedRight = ['selectpage'];

    public function _initialize() {
        parent::_initialize();
        $this->model = model('Complain');
        $this->communityModel = model('Community');
        $this->view->assign('community',$this->communityModel->where(array('code'=>array('in',parent::getCommunityIdByAuth())))->field('code,name')->select());
        $this->view->assign("is_readswitch",  ['1'=>__('Anonymity'), '0'=>__('NoAnonymity')]);
     }

    public function index() {
        //设置过滤方法
        $this->request->filter(['strip_tags']);
        if ($this->request->isAjax()) {
            //如果发送的来源是Selectpage，则转发到Selectpage
            if ($this->request->request('pkey_name')) {
                return $this->selectpage();
            }
            return $this->handleSearch($this->searchfields);
        }
        return $this->view->fetch();
    }

    public function detail($ids = null) {
      $repair = $this->model->get($ids);
      $community = model('Community')->where(array('code'=>$repair['community_code']))->find();
      $admin1 = model('Admin')->where(array('id'=>$repair['admin_id']))->find();
      $this->view->assign('community',$community);
      $this->view->assign('admin1',$admin1);
      return parent::modify($ids);
    }

    public function add() {
        if ($this->request->isPost()) {
            $params = $this->request->post('row/a');
            $admin = Session::get('admin');
            $params['admin_id'] = $admin['id'];
            $this->request->post(array('row'=>$params));
        }
        return parent::create();
    }

    public function edit($ids = null) {
        if ($this->request->isPost()) {
            $params = $this->request->post("row/a");
            $this->request->post(['row' => $params]);
        }
        $repair = $this->model->get($ids);
        $community = model('Community')->where(array('code'=>$repair['community_code']))->find();
        $admin1 = model('Admin')->where(array('id'=>$repair['admin_id']))->find();
        $this->view->assign('community',$community);
        $this->view->assign('admin1',$admin1);

        return parent::modify($ids);
    }

    public function del($ids = null){
        $where = array(
            'id' => array('in',$ids)
        );
        parent::delete($where);
    }

    public function selectpage() {
        return parent::selectpage();
    }

    private function handleSearch($searchfields=null) {
        $append = array(
            array('community_code','in',parent::getCommunityIdByAuth())
        );
        $append = array_merge($append,$this->buildCommonSearch());
        list($where, $sort, $order, $offset, $limit, $orderParams) = $this->buildparams($searchfields,null,$append);
        if($this->auth->checkIsUser($userInfo['id']) === true){
          $total = $this->model->where('admin_id', $this->auth->id)->count();
          $list = $this->model->with('community,admin')->where('admin_id', $this->auth->id)->order($orderParams)->limit($offset, $limit)->select();
        }else{
          $total = $this->model->where($where)->count();
          $list = $this->model->with('community,admin')->where($where)->order($orderParams)->limit($offset, $limit)->select();
        }
        
        $result = array("total" => $total, "rows" => $list);
        return json($result);
    }

    /**
     * 自定义搜索
     * @return array
     */
    private function buildCommonSearch() {
        $where = array();
        $searchs = $this->request->request('query/a');
        if ($searchs['community_code']) {
            $where[] = array('community_code', '=', $searchs['community_code']);
        }
        return $where;
    }

}