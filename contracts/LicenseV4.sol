pragma solidity ^0.4.21;
import "./License.sol";

contract LicenseV4 is License {

  function aCustomerByOwner(uint256 _appId,address _address) public view isAppOwner(_appId) returns(bool isCustomer, uint256 customerId){
    require(_appId >= 0 && _appId < apps.length);
    App storage app = apps[_appId];
    isCustomer = false;
    for (uint256 i = 0; i < app.customersNum; i=i.add(1)) {
      Customer storage customer = app.toCustomer[i];
      if(customer.addr == _address){
        isCustomer = true;
        customerId = i;
        break;
      }
    }
  }

  function applyLicenseByOwner(uint256 _appId,uint256 _licenseId, address _other) external payable isAppOwner(_appId) whenNotPaused {
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
    (isCustomer, customerId) = aCustomerByOwner(_appId,_other);
    if(isCustomer == true){
      Customer storage customer = app.toCustomer[customerId];
      uint256 oldLicenseId = customer.licenseId;
      uint256 oldLicenseStartTime = customer.licenseStartTime;
      customer.licenseId = _licenseId;
      customer.licenseStartTime = now;
      /* LicenseType storage oldLicense = app.toLicenseType[oldLicenseId]; */
      emit UpdateCustomer(now, _other, _appId, oldLicenseId, oldLicenseStartTime, _licenseId, license.fee, license.validateTime, customer.licenseStartTime);

    }else{
      uint256 licenseStartTime = now;
      app.toCustomer[app.customersNum]= Customer(_other,_licenseId,licenseStartTime);
      app.customersNum = app.customersNum.add(1);
      emit NewCustomer(now, _other, _appId, _licenseId, license.fee, license.validateTime, licenseStartTime);
    }
  }
  /* function () payable public {} */

}
