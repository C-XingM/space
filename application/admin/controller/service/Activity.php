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

class Activity extends Backend {

    protected $model = null;
    protected $communityModel = null;
    //检索时匹配的字段
    protected $searchfields = 'community_code,status,tel';
    protected $noNeedRight = ['selectpage','get_building_by_cm_code,get_house_by_cm_code'];

    public function _initialize() {
        parent::_initialize();
        $this->model = model('Activity');
        $this->communityModel = model('Community');
        $this->housemodel = model('House');
        $this->adminModel = model('Admin');
        $this->statusModel = model('ActivityStatus');
        $this->buildingModel = model('Building');
        $this->view->assign('community',$this->communityModel->where(array('code'=>array('in',parent::getCommunityIdByAuth())))->field('code,name')->select());
        $this->view->assign("status", ['0'=>__('InValid'),'1'=>__('Valid'),'2'=>__('Valid1')]);
        $this->view->assign("type", ['0'=>__('Teaching'),'1'=>__('Recreational'),'2'=>__('Others')]);
        //$this->view->assign("reason", ['场地申请符合标准，审核通过','活动规模与申请的场地大小不符合','活动有问题']);
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

    public function apply($ids = null) {
      $repair = $this->housemodel->get($ids);
      $community = model('Community')->where(array('code'=>$repair['community_code']))->find();
      $building = model('Building')->where(array('code'=>$repair['building_code']))->find();
      $house = model('House')->where(array('code'=>$repair['code']))->find();
      $this->view->assign('community',$community);
      $this->view->assign('building',$building);
      $this->view->assign('house',$house);
      if ($this->request->isPost()) {
        $params = $this->request->post('row/a');
        $params['community_code']=$community['code'];
        $params['building_code']=$building['code'];
        $params['house_code']=$house['code'];
        $admin = Session::get('admin');
        $params['admin_id'] = $admin['id'];
        $time = Session::get('time');
        $params['begin_time']=$time['s_time'];
        $params['end_time']=$time['e_time'];
        $params['begin_time'] = strtotime($params['begin_time']);
        $params['end_time'] = strtotime($params['end_time']);
        $this->request->post(array('row'=>$params));
    }
    return parent::create();
    }

    public function detail($ids = null) {
      $repair = $this->model->get($ids);
      $community = model('Community')->where(array('code'=>$repair['community_code']))->find();
      $building = model('Building')->where(array('code'=>$repair['building_code']))->find();
      $house = model('House')->where(array('code'=>$repair['house_code']))->find();
      $admin = model('Admin')->where(array('id'=>$repair['admin_id']))->find();
      $this->view->assign('community',$community);
      $this->view->assign('building',$building);
      $this->view->assign('house',$house);
      $this->view->assign('admin',$admin);
      return parent::modify($ids);
    }

    public function add() {
        if ($this->request->isPost()) {
            $params = $this->request->post('row/a');
            $params['code'] = $this->model->getMaxCode();
            $params['begin_time'] = strtotime($params['begin_time']);
            $params['end_time'] = strtotime($params['end_time']);
            $this->request->post(array('row'=>$params));
        }
        return parent::create();
    }

    public function edit($ids = null) {
        $repair = $this->model->get($ids);
        $community = model('Community')->where(array('code'=>$repair['community_code']))->find();
        $building = model('Building')->where(array('code'=>$repair['building_code']))->find();
        $house = model('House')->where(array('code'=>$repair['house_code']))->find();
        $admin = model('Admin')->where(array('id'=>$repair['admin_id']))->find();
        $this->view->assign('community',$community);
        $this->view->assign('building',$building);
        $this->view->assign('house',$house);
        $this->view->assign('admin',$admin);
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
        list($where, $sort, $order, $offset, $limit,$orderParams) = $this->buildparams($searchfields,null,$append);
        if($this->auth->checkIsUser($userInfo['id']) === true){
          $total = $this->model->where('admin_id', $this->auth->id)->count();
          $list = $this->model->with('community,building,house,admin')->where('admin_id', $this->auth->id)->order($orderParams)->limit($offset, $limit)->select();
        }else{
          $total = $this->model->where($where)->count();
          $list = $this->model->with('community,building,house,admin')->where($where)->order($orderParams)->limit($offset, $limit)->select();
        }
        $result = array("total" => $total, "rows" => $list);
        return json($result);
    }
    public function get_building_by_cm_code() {
      $result = array();
      $cmCode = $this->request->request('community_code');
      $building = $this->buildingModel->getBuildingByCMCode($cmCode);
      $result['building'] = $building;
      return json($result);
    }
    public function get_house_by_cm_code() {
      $result = array();
      $buCode = $this->request->request('building_code');
      $building = $this->buildingModel->getHouseByCMCode($cmCode);
      $result['building'] = $building;
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
        if ($searchs['status']) {
          $where[] = array('status', '=', $searchs['status']);
        }
        return $where;
    }

}