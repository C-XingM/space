<?php
namespace app\admin\controller\house;

use app\common\controller\Backend;

/* 场地类型管理 */

class Building extends Backend {

    protected $model = null;
    protected $communityModel = null;
    //检索时匹配的字段
    protected $searchfields = 'code,name';
    protected $noNeedRight = ['selectpage'];

    public function _initialize() {
        parent::_initialize();
        $this->model = model('Building');
        $this->communityModel = model('Community');
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
            $this->request->post(array('row'=>$params));
        }
        return parent::create();
    }

    public function edit($ids = null) {
        if ($this->request->isPost()) {
            $params = $this->request->post("row/a");
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
        list($where, $sort, $order, $offset, $limit, $orderParams) = $this->buildparams($searchfields,null,$append);
        $total = $this->model->where($where)->count();
        $list = $this->model->with('community')->where($where)->order($orderParams)->limit($offset, $limit)->select();
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