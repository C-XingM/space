<?php
namespace app\admin\controller\house;
use think\Db;
use app\common\controller\Backend;

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
        $this->communityModel = model('Community');
        $this->buildingModel = model('Building');
        $this->houseModel = model('House');
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
            $params['code'] = $this->model->getMaxCode();
            //$params['enter_time'] = strtotime($params['enter_time']);
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
        // dump($append);die;
        list($where, $sort, $order, $offset, $limit,$orderParams) = $this->buildparams($searchfields,null,$append);
        $total = $this->model->where($where)->count();
        $list = $this->model->with('community,building')->where($where)->order($orderParams)->limit($offset, $limit)->select();
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


        return $where;
    }
    public function houseSearch(){

      $searchs = $this->request->request('query/a');
      $where = " 1=1";
      $where2 = " status!=2";
      if($searchs['community_code']){
        $where.= " and community_code ='".$searchs['community_code']."'";
      }
      if($searchs['building_code']){
        $where.= " and building_code ='".$searchs['building_code']."'";
      }
      $time['s_time'] = "";
      $time['e_time'] = "";
      if ($searchs['enter_time_begin'] && $searchs['enter_time_end']) {
          $where2.= " and (begin_time>=".strtotime($searchs['enter_time_end']) ." OR end_time>=".strtotime($searchs['enter_time_begin']).")";
          $time['s_time'] = $searchs['enter_time_begin'];
          $time['e_time'] = $searchs['enter_time_end'];
          
      }else if ($searchs['enter_time_end']) {
        // $where2.= " and end_time>=".strtotime($searchs['enter_time_end']);
        $where2.= " and  end_time>=".strtotime($searchs['enter_time_begin']);
        $time['e_time'] = $searchs['enter_time_end'];
      }else if($searchs['enter_time_begin']){
        $where2.= " and  begin_time>=".strtotime($searchs['enter_time_end']);
        $time['s_time'] = $searchs['enter_time_begin'];
      }
      SESSION('time',$time);
      $list = Db::table("es_house")->where($where)->select();
      foreach($list as $key=>&$value){
        $where3 = "";
        $list[$key]['building'] = Db::table("es_building")->where("code='".$value['building_code']."'")->find();
        $list[$key]['community'] = Db::table("es_community")->where("code='".$value['community_code']."'")->find();
        if ($searchs['enter_time_begin'] || $searchs['enter_time_end']) {
          $where3=$where2." and house_code='".$value['code']."'";          
          $is_house = Db::table("es_activity")->where($where3)->find()['id'];
        }
        if($is_house){
          unset($list[$key]);
        }
      }
        $list=array_merge($list);
        
      $total = count($list);
      $result = array("total" => $total, "rows" => $list);
      return json($result);

      
    }
   
    
}