<?php
namespace app\admin\controller\owners;
use app\common\controller\Backend;
use fast\Random;
use think\Db;
/**
 * Created by PhpStorm.
 * FileName: Index.php
 * User: Administrator
 * Date: 2017/11/01
 * Time: 13:42
 */

class Index extends Backend {
  protected $model = null;
  protected $communityModel = null;
  protected $buildingModel = null;
  
  //检索时匹配的字段
  protected $searchfields = 'code,name';//'code,name,owner_name,owner_tel'; 
  protected $noNeedRight = ['selectpage','get_building_by_cm_code'];

  public function _initialize() {
      parent::_initialize();
      $this->model = model('House');
      //$this->model = model('Activity');
      $this->communityModel = model('Community');
      $this->buildingModel = model('Building');
      $this->view->assign('community',$this->communityModel->where(array('code'=>array('in',parent::getCommunityIdByAuth())))->field('code,name')->select());
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
      return parent::modify($ids);
  }

  public function add() {
      if ($this->request->isPost()) {
          $params = $this->request->post('row/a');
          $this->request->post(array('row'=>$params));
      }
      return parent::create();
  }


  public function edit($ids = null) {
      if ($this->request->isPost()) {
          $params = $this->request->post("row/a");
          //$params['enter_time'] = strtotime($params['enter_time']);
          $this->request->post(['row' => $params]);
      }
      $community = model('Community')->where(array('code'=>$repair['community_code']))->find();
      $building = model('Building')->where(array('code'=>$repair['building_code']))->find();
      $house = model('House')->where(array('code'=>$repair['house_code']))->find();
      $this->view->assign('community',$community);
      $this->view->assign('building',$building);
      $this->view->assign('house',$house);
      return parent::modify($ids,'add');
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
      $total = $this->model->where($where)->count();
      $list = $this->model->with('community,building,house,activity')->where($where)->order($orderParams)->limit($offset, $limit)->select();
      $result = array("total" => $total, "rows" => $list);
      echo $result;
      return json($result);
  }

  public function get_building_by_cm_code() {
      $result = array();
      $cmCode = $this->request->request('community_code');
      // dump($cmCode);die;
      $building = $this->buildingModel->getBuildingByCMCode($cmCode);
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
      if ($searchs['building_code']) {
          $where[] = array('building_code', '=', $searchs['building_code']);
      }
      if ($searchs['enter_time_begin']) {
          $where[] = array('begin_time', '>=', strtotime($searchs['enter_time_begin'].'00:00:00'));
      }
      if ($searchs['enter_time_end']) {
          $where[] = array('end_time', '<=', strtotime($searchs['enter_time_end'].'23:59:59'));
      }
      return $where;
  }

}
