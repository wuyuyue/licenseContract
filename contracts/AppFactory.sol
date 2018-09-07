pragma solidity ^0.4.21;

import "openzeppelin-zos/contracts/math/SafeMath.sol";
import "openzeppelin-zos/contracts/lifecycle/Pausable.sol";

contract AppFactory is Pausable {
  using SafeMath for uint256;

  event NewApp(uint256 _creationTime, address  _creator, uint256  _appId, string _appName, uint256[] _licenseFees, uint256[]  _licenseValidateTimes);



  struct Customer{
   address addr;
   uint256 licenseId;
   uint256 licenseStartTime;
  }

  struct LicenseType{
   uint256 fee; // wei unit
   uint256 validateTime; // seconds unit
  }



  struct App{
   string name;
   uint256 licenseTypeNum;
   uint256 customersNum;
   mapping(uint256 => Customer)  toCustomer;
   mapping(uint256 => LicenseType)  toLicenseType;
  }


  uint256 constant public appFee = 0.01 ether; // 0.01 eth default

  App[] internal apps;

  mapping (uint256 => address) public appToOwner;
  mapping (address => uint256) ownerAppCount;

  modifier isAppOwner(uint256 _appId){
    require(appToOwner[_appId] == msg.sender );
    _;
  }
  /* function initialize(address _sender, uint256 _appFee) isInitializer("AppFactory", "0") public {
    Pausable.initialize(_sender);
    appFee = _appFee;
  } */
  /* function AppFactory() public {
    appFee = 0.01 ether;
  } */
  function _createApp(string _name, uint256[] _licenseFees, uint256[] _licenseValidateTimes) internal {
   uint256 id = apps.push(App(_name,_licenseFees.length, 0)).sub(1);
   appToOwner[id] = msg.sender;
   ownerAppCount[msg.sender] = ownerAppCount[msg.sender].add(1);

   for (uint256 i = 0; i < apps[id].licenseTypeNum; i=i.add(1)) {
      apps[id].toLicenseType[i] = LicenseType(_licenseFees[i],_licenseValidateTimes[i]);
   }
   emit NewApp(now,msg.sender, id, _name,_licenseFees, _licenseValidateTimes);
  }

  function createFreeApp(string _name) external payable whenNotPaused {
   require(msg.value >= appFee);
   owner.transfer(appFee);
   if(msg.value.sub(appFee) > 0){
     msg.sender.transfer(msg.value.sub(appFee));
   }
   uint256[] memory licenseFees = new uint256[](1);
   licenseFees[0] = 0 ether;
   uint256[] memory licenseValidateTimes = new uint256[](1);

   licenseValidateTimes[0] = 365*100 days;

   _createApp(_name, licenseFees, licenseValidateTimes);
  }

  function createApp(string _name,uint256[] _licenseFees, uint256[] _licenseValidateTimes ) external payable whenNotPaused {
   require(msg.value >= appFee);
   require(_licenseFees.length == _licenseValidateTimes.length );
   owner.transfer(appFee);
   if(msg.value.sub(appFee) > 0){
     msg.sender.transfer(msg.value.sub(appFee));
   }
   _createApp(_name,_licenseFees,_licenseValidateTimes);
  }

  function getYourApps() external view returns(uint256[]) {
   uint256[] memory ids = new uint256[](ownerAppCount[msg.sender]);
   uint256 counter = 0;
   for (uint256 i = 0; i < apps.length; i=i.add(1)) {
     if (appToOwner[i] == msg.sender) {
       ids[counter] = i;
       counter=counter.add(1);
     }
   }
   return (ids);
  }

  function getAppBrief(uint256 _appId) external view isAppOwner(_appId)  returns(string , uint256 ,  uint256) {
    App storage app = apps[_appId];
    return (app.name, app.licenseTypeNum, app.customersNum);
  }
  function getAppLicenseList(uint256 _appId) external view isAppOwner(_appId)  returns( uint256[] , uint256[]  ) {
     App storage app = apps[_appId];
     uint256  licenseTypeNum = app.licenseTypeNum;
     uint256[] memory licenseFees = new uint256[](licenseTypeNum);
     uint256[] memory licenseValidateTimes = new uint256[](licenseTypeNum);
     for (uint256 i = 0; i < licenseTypeNum; i=i.add(1)) {
        LicenseType storage licenseType = app.toLicenseType[i];
        licenseFees[i] = licenseType.fee;
        licenseValidateTimes[i] = licenseType.validateTime;
     }
     return (licenseFees, licenseValidateTimes);
  }
  function getAppCustomerList(uint256 _appId) external view isAppOwner(_appId) returns( address[], uint256[] , uint256[]  ) {
      App storage app = apps[_appId];
      uint256  customersNum = app.customersNum;
      address[] memory customerAddrs = new address[](customersNum);
      uint256[] memory customerLicenseIds = new uint256[](customersNum);
      uint256[] memory customerLicenseStartTimes = new uint256[](customersNum);

      for (uint256 j = 0; j < customersNum; j=j.add(1)) {
         Customer storage customer = app.toCustomer[j];
         customerAddrs[j] = customer.addr;
         customerLicenseIds[j] = customer.licenseId;
         customerLicenseStartTimes[j] = customer.licenseStartTime;
      }
      return (customerAddrs, customerLicenseIds, customerLicenseStartTimes);
  }
  function getAllApps() external view  onlyOwner returns(uint256[]) {
    uint256[] memory ids = new uint256[](apps.length);

    for (uint256 i = 0; i < apps.length; i=i.add(1)) {
        ids[i] = i;
    }
    return (ids);
  }

  /* function setAppFee(uint256 _newFee) external onlyOwner{
    appFee = _newFee;
  } */

  function () payable public {}
  function claim() external onlyOwner {
      selfdestruct(msg.sender);
  }

}
