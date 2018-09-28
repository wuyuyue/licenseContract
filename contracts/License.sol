pragma solidity ^0.4.21;
import "./AppFactory.sol";
import "openzeppelin-zos/contracts/math/SafeMath.sol";

contract License is AppFactory {
  using SafeMath for uint256;

  event NewCustomer(uint256 _applyTime, address indexed _applior, uint256 indexed _appId,  uint256 indexed _licenseId, uint256 _licenseFee, uint256 _licenseValidateTime, uint256 _LicenseStartTime);
  event UpdateCustomer(uint256 _updateTime,address indexed _applior,  uint256 indexed _appId, uint256 _oldLicenseId, uint256 _oldLicenseStartTime, uint256 indexed _newLicenseId,  uint256 _newLicenseFee, uint256 _newLicenseValideTime, uint256 _newLicenseStartTime);

  /* function initialize(address _sender, uint256 _appFee) isInitializer("License", "0") public {
    AppFactory.initialize(_sender,_appFee);
  } */
  function aCustomer(uint256 _appId) public view returns(bool isCustomer, uint256 customerId){
    require(_appId >= 0 && _appId < apps.length);
    App storage app = apps[_appId];
    isCustomer = false;
    for (uint256 i = 0; i < app.customersNum; i=i.add(1)) {
      Customer storage customer = app.toCustomer[i];
      if(customer.addr == msg.sender){
        isCustomer = true;
        customerId = i;
        break;
      }
    }
  }

  function applyLicense (uint256 _appId,uint256 _licenseId) external payable whenNotPaused {
    require(_appId >= 0 && _appId < apps.length);
    App storage app = apps[_appId];
    require(_licenseId >= 0 && _licenseId < app.licenseTypeNum);
    LicenseType storage license = app.toLicenseType[_licenseId];

    // could not apply license already offlineAppLicense
    require(license.offline==false);
    require(msg.value >= license.fee);
    appToOwner[_appId].transfer(license.fee);
    if(msg.value.sub(license.fee) > 0){
      msg.sender.transfer(msg.value.sub(license.fee));
    }
    bool isCustomer;
    uint256 customerId;
    (isCustomer, customerId) = aCustomer(_appId);
    if(isCustomer == true){
      Customer storage customer = app.toCustomer[customerId];
      uint256 oldLicenseId = customer.licenseId;
      uint256 oldLicenseStartTime = customer.licenseStartTime;
      customer.licenseId = _licenseId;
      customer.licenseStartTime = now;
      /* LicenseType storage oldLicense = app.toLicenseType[oldLicenseId]; */
      emit UpdateCustomer(now, msg.sender, _appId, oldLicenseId, oldLicenseStartTime, _licenseId, license.fee, license.validateTime, customer.licenseStartTime);

    }else{
      uint256 licenseStartTime = now;
      app.toCustomer[app.customersNum]= Customer(msg.sender,_licenseId,licenseStartTime);
      app.customersNum = app.customersNum.add(1);
      emit NewCustomer(now, msg.sender, _appId, _licenseId, license.fee, license.validateTime, licenseStartTime);
    }
  }

  function getLicenseInfo(uint256 _appId) external view returns(bool isCustomer, uint256 licenseId,   uint256 licenseValidateTime, uint256 licenseStartTime, bool licenseValidate ){
    uint256 customerId;
    (isCustomer, customerId) = aCustomer(_appId);
    if(isCustomer == true){
      App storage app = apps[_appId];
      Customer storage customer = app.toCustomer[customerId];
      licenseId = customer.licenseId;
      LicenseType storage license = app.toLicenseType[licenseId];
      licenseValidateTime = license.validateTime;
      licenseStartTime = customer.licenseStartTime;
      licenseValidate = license.validateTime.add(customer.licenseStartTime) > uint256(now) ;
    } else{
      licenseId = 0;
      licenseValidateTime = 0;
      licenseStartTime = 0;
      licenseValidate = false;
    }
  }
  /* function () payable public {} */

}
