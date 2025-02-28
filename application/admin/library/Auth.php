<?php

namespace app\admin\library;

use app\admin\model\Admin;
use fast\Random;
use fast\Tree;
use think\Cookie;
use think\Request;
use think\Session;

class Auth extends \fast\Auth
{

    protected $requestUri = '';
    protected $breadcrumb = [];

    public function __construct()
    {
        parent::__construct();
    }

    public function __get($name)
    {
        return Session::get('admin.' . $name);
    }

    public function login($username, $password, $keeptime = 0)
    {
        $admin = Admin::get(['username' => $username]);
        if (!$admin)
        {
            return false;
        }
        if ($admin->password != md5(md5($password) . $admin->salt))
        {
            $admin->loginfailure++;
            $admin->save();
            return false;
        }
        $admin->loginfailure = 0;
        $admin->logintime = time();
        $admin->token = Random::uuid();
        $admin->save();
        Session::set("admin", $admin);
        $this->keeplogin($keeptime);
        return true;
    }

    /**
     * 注销登录
     */
    public function logout()
    {
        $admin = Admin::get(intval($this->id));
        if (!$admin)
        {
            return true;
        }
        $admin->token = '';
        $admin->save();
        Session::delete("admin");
        Cookie::delete("keeplogin");
        return true;
    }

    /**
     * 自动登录
     * @return boolean
     */
    public function autologin()
    {
        $keeplogin = Cookie::get('keeplogin');
        if (!$keeplogin)
        {
            return false;
        }
        list($id, $keeptime, $expiretime, $key) = explode('|', $keeplogin);
        if ($id && $keeptime && $expiretime && $key && $expiretime > time())
        {
            $admin = Admin::get($id);
            if (!$admin || !$admin->token)
            {
                return false;
            }
            //token有变更
            if ($key != md5(md5($id) . md5($keeptime) . md5($expiretime) . $admin->token))
            {
                return false;
            }
            Session::set("admin", $admin);
            //刷新自动登录的时效
            $this->keeplogin($keeptime);
            return true;
        }
        else
        {
            return false;
        }
    }

    /**
     * 刷新保持登录的Cookie
     * @param int $keeptime
     * @return boolean
     */
    protected function keeplogin($keeptime = 0)
    {
        if ($keeptime)
        {
            $expiretime = time() + $keeptime;
            $key = md5(md5($this->id) . md5($keeptime) . md5($expiretime) . $this->token);
            $data = [$this->id, $keeptime, $expiretime, $key];
            Cookie::set('keeplogin', implode('|', $data));
            return true;
        }
        return false;
    }

    public function check($name, $uid = '', $relation = 'or', $mode = 'url')
    {
        return parent::check($name, $this->id, $relation, $mode);
    }

    /**
     * 检测当前控制器和方法是否匹配传递的数组
     *
     * @param array $arr 需要验证权限的数组
     */
    public function match($arr = [])
    {
        $request = Request::instance();
        $arr = is_array($arr) ? $arr : explode(',', $arr);
        if (!$arr)
        {
            return FALSE;
        }

        // 是否存在
        if (in_array(strtolower($request->action()), $arr) || in_array('*', $arr))
        {
            return TRUE;
        }

        // 没找到匹配
        return FALSE;
    }

    /**
     * 检测是否登录
     *
     * @return boolean
     */
    public function isLogin()
    {
        return Session::get('admin') ? true : false;
    }

    /**
     * 获取当前请求的URI
     * @return string
     */
    public function getRequestUri()
    {
        return $this->requestUri;
    }

    /**
     * 设置当前请求的URI
     * @param string $uri
     */
    public function setRequestUri($uri)
    {
        $this->requestUri = $uri;
    }

    public function getGroups($uid = null)
    {
        $uid = is_null($uid) ? $this->id : $uid;
        return parent::getGroups($uid);
    }

    public function getRuleList($uid = null)
    {
        $uid = is_null($uid) ? $this->id : $uid;
        return parent::getRuleList($uid);
    }

    public function getUserInfo($uid = null)
    {
        $uid = is_null($uid) ? $this->id : $uid;

        return $uid != $this->id ? Admin::get(intval($uid)) : Session::get('admin');
    }

    public function getRuleIds($uid = null)
    {
        $uid = is_null($uid) ? $this->id : $uid;
        return parent::getRuleIds($uid);
    }

    public function isSuperAdmin()
    {
        return in_array('*', $this->getRuleIds()) ? TRUE : FALSE;
    }

    /**
     * 获取管理员所属于的分组ID
     * @param int $uid
     * @return array
     */
    public function getGroupIds($uid = null)
    {
        $groups = $this->getGroups($uid);
        $groupIds = [];
        foreach ($groups as $K => $v)
        {
            $groupIds[] = (int) $v['group_id'];
        }
        return $groupIds;
    }

    /**
     * 取出当前管理员所拥有权限的分组
     * @param boolean $withself 是否包含当前所在的分组
     * @return array
     */
    public function getChildrenGroupIds($withself = false)
    {
        //取出当前管理员所有的分组
        $groups = $this->getGroups();
        $groupIds = [];
        foreach ($groups as $k => $v)
        {
            $groupIds[] = $v['id'];
        }
        // 取出所有分组
        $groupList = model('AuthGroup')->all(['status' => 'normal']);
        $objList = [];
        foreach ($groups as $K => $v)
        {
            if ($v['rules'] === '*')
            {
                $objList = $groupList;
                break;
            }
            // 取出包含自己的所有子节点
            $childrenList = Tree::instance()->init($groupList)->getChildren($v['id'], true);
            $obj = Tree::instance()->init($childrenList)->getTreeArray($v['pid']);
            $objList = array_merge($objList, Tree::instance()->getTreeList($obj));
        }
        $childrenGroupIds = [];
        foreach ($objList as $k => $v)
        {
            $childrenGroupIds[] = $v['id'];
        }
        if (!$withself)
        {
            $childrenGroupIds = array_diff($childrenGroupIds, $groupIds);
        }
        return $childrenGroupIds;
    }

    /**
     * 取出当前管理员所拥有权限的管理员
     * @param boolean $withself 是否包含自身
     * @return array
     */
    public function getChildrenAdminIds($withself = false)
    {
        $groupIds = $this->getChildrenGroupIds(false);
        $childrenAdminIds = [];
        $authGroupList = model('AuthGroupAccess')
                ->field('uid,group_id')
                ->where('group_id', 'in', $groupIds)
                ->select();

        foreach ($authGroupList as $k => $v)
        {
            $childrenAdminIds[] = $v['uid'];
        }
        if ($withself)
        {
            if (!in_array($this->id, $childrenAdminIds))
            {
                $childrenAdminIds[] = $this->id;
            }
        }
        else
        {
            $childrenAdminIds = array_diff($childrenAdminIds, [$this->id]);
        }
        return $childrenAdminIds;
    }

    /**
     * 获得面包屑导航
     * @param string $path
     * @return array
     */
    public function getBreadCrumb($path = '')
    {
        if ($this->breadcrumb || !$path)
            return $this->breadcrumb;
        $path_rule_id = 0;
        foreach ($this->rules as $rule)
        {
            $path_rule_id = $rule['name'] == $path ? $rule['id'] : $path_rule_id;
        }
        if ($path_rule_id)
        {
            $this->breadcrumb = Tree::instance()->init($this->rules)->getParents($path_rule_id, true);
            foreach ($this->breadcrumb as $k => &$v)
            {
                $v['url'] = url($v['name']);
                $v['title'] = __($v['title']);
            }
        }
        return $this->breadcrumb;
    }

    /**
     * 获取左侧菜单栏
     *
     * @param array $params URL对应的badge数据
     * @return string
     */
    public function getSidebar($params = [], $fixedPage = 'dashboard')
    {
        $colorArr = ['red', 'green', 'yellow', 'blue', 'teal', 'orange', 'purple'];
        $colorNums = count($colorArr);
        $badgeList = [];
        $module = request()->module();
        // 生成菜单的badge
        foreach ($params as $k => $v)
        {

            $url = $k;

            if (is_array($v))
            {
                $nums = isset($v[0]) ? $v[0] : 0;
                $color = isset($v[1]) ? $v[1] : $colorArr[(is_numeric($nums) ? $nums : strlen($nums)) % $colorNums];
                $class = isset($v[2]) ? $v[2] : 'label';
            }
            else
            {
                $nums = $v;
                $color = $colorArr[(is_numeric($nums) ? $nums : strlen($nums)) % $colorNums];
                $class = 'label';
            }
            //必须nums大于0才显示
            if ($nums)
            {
                $badgeList[$url] = '<small class="' . $class . ' pull-right bg-' . $color . '">' . $nums . '</small>';
            }
        }

        // 读取管理员当前拥有的权限节点
        $userRule = $this->getRuleList();
        $select_id = 0;
        $pinyin = new \Overtrue\Pinyin\Pinyin('Overtrue\Pinyin\MemoryFileDictLoader');
        // 必须将结果集转换为数组
        $ruleList = collection(model('AuthRule')->where('ismenu', 1)->order('weigh', 'desc')->cache("__menu__")->select())->toArray();
        foreach ($ruleList as $k => &$v)
        {
            if (!in_array($v['name'], $userRule))
            {
                unset($ruleList[$k]);
                continue;
            }
            $select_id = $v['name'] == $fixedPage ? $v['id'] : $select_id;
            $v['url'] = '/' . $module . '/' . $v['name'];
            $v['badge'] = isset($badgeList[$v['name']]) ? $badgeList[$v['name']] : '';
            $v['py'] = $pinyin->abbr($v['title'], '');
            $v['pinyin'] = $pinyin->permalink($v['title'], '');
            $v['title'] = __($v['title']);
        }
        // 构造菜单数据
        Tree::instance()->init($ruleList);
        $menu = Tree::instance()->getTreeMenu(0, '<li class="@class"><a href="@url" addtabs="@id" url="@url" py="@py" pinyin="@pinyin"><i class="@icon"></i> <span>@title</span> <span class="pull-right-container">@caret @badge</span></a> @childlist</li>', $select_id, '', 'ul', 'class="treeview-menu"');
        return $menu;
    }

    /**
     * 检查登录用户是否为超级管理员
     * @param null $uid
     * @return bool
     */
    public function checkIsSuperAdmin($uid = null) {
        $userId = $uid;
        if (!$userId) {
            $admin = Session::get('admin');
            if($admin) {
                $userInfo = json_decode($admin,true);
                $userId = $userInfo['id'];
            }
        }
        if($userId) {
            $groupIds = $this->getGroupIds($userId);
            $minPid = model('AuthGroup')->where(array('id'=>array('in',$groupIds)))->min('pid');
            return $minPid == 0 ? true : false;
        }
        return false;
    }
    /**
     * 检查登录用户是否为用户
     * @param null $uid
     * @return bool
     */
    public function checkIsUser($uid = null) {
      $userId = $uid;
      if (!$userId) {
          $admin = Session::get('admin');
          if($admin) {
              $userInfo = json_decode($admin,true);
              $userId = $userInfo['id'];
          }
      }
      if($userId) {
          $groupIds = $this->getGroupIds($userId);
          $minPid = model('AuthGroup')->where(array('id'=>array('in',$groupIds)))->min('pid');
          return $minPid == 2 ? true : false;
      }
      return false;
  }

}
