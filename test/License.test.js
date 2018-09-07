const BigNumber = web3.BigNumber;
require('chai')
  .use(require('chai-bignumber')(BigNumber))
  .use(require('chai-as-promised'))
.should();
const License = artifacts.require('License');



contract('License', accounts => {
  let ether = Math.pow(10,18); // wei
  let dayUnit = 24 * 60 * 60; // second
  const deployer = accounts[1];
  const develop1 = accounts[2];
  const develop2 = accounts[3];
  const customer1 = accounts[4];
  const customer2 = accounts[5];
  let license = null;
  let appId1 = null;
  let appId2 = null;

  let licenseInfo = function(isCustomer,licenseId, licenseValidateTime, licenseStartTime, licenseValidate ){
    if(isCustomer==false){
      return "not a customer";
    }
    var result = "is a customer with licenseId " + licenseId;
    if(licenseValidateTime == dayUnit * 365 * 100 ){
      result += "(license is long-term validate)";

    } else{
      result += "(";
      result += "license now is " +(licenseValidate?"validate":"invalidate") + ",";

      result += " validates in " +licenseValidateTime.toNumber()/dayUnit+"days,";

      result += " start at " + new Date(licenseStartTime.toNumber()*1000);

      result += ")";
    }
    return result;

  };

  beforeEach(async () => {
    if(license==null){
      console.log("deployer", web3.eth.getBalance(deployer).toNumber());

      license = await License.new();
      await license.initialize(deployer);
      await Promise.all([
          license.createFreeApp("test1",{from: develop1,value: 0.01 * ether}),
          license.createApp("test2",[1 * ether, 2 * ether],[5 * dayUnit/ dayUnit, 1*dayUnit], {from: develop1,value: 1 * ether})
      ]);
      const appIds = await license.getYourApps({from:develop1});
      app1 = appIds[0];
      app2 = appIds[1];
      console.log("deployer", web3.eth.getBalance(deployer).toNumber());

    }
  });

  describe('License', () => {
    it('not yet a customer of given app', async () => {
      const [isCustomer,customerId] = await license.aCustomer(app1,{from: develop1});
      isCustomer.should.equal(false);
    });
    it('apply a customer of given app', async () => {
      await license.applyLicense(app1, 0, {from: customer1});
      const [isCustomer,customerId] = await license.aCustomer(app1,{from: customer1});
      isCustomer.should.equal(true);
    });
    it('user is licensed for given app', async () => {
      console.log("develop1", web3.eth.getBalance(develop1).toNumber());
      console.log("customer1", web3.eth.getBalance(customer1).toNumber());
      await license.applyLicense(app1, 0, {from: customer1});
      const [isCustomer,licenseId, licenseValidateTime, licenseStartTime, licenseValidate  ] = await license.getLicenseInfo(app1,{from: customer1});
      licenseValidate.should.equal(true);
      console.log(licenseInfo(isCustomer,licenseId, licenseValidateTime, licenseStartTime, licenseValidate));

      console.log("develop1", web3.eth.getBalance(develop1).toNumber());
      console.log("customer1", web3.eth.getBalance(customer1).toNumber());

    });
    it('user is not licensed for given app case 1', async () => {
      const [isCustomer,licenseId, licenseValidateTime, licenseStartTime, licenseValidate  ] = await license.getLicenseInfo(app2,{from: customer1});
      licenseValidate.should.equal(false);
      console.log(licenseInfo(isCustomer,licenseId, licenseValidateTime, licenseStartTime, licenseValidate));

    });
    it('user is licensed but now invalidate', async () => {
      console.log("develop1", web3.eth.getBalance(develop1).toNumber());
      console.log("customer2", web3.eth.getBalance(customer2).toNumber());
      await license.applyLicense(app2, 0, {from: customer2, value: 2 * ether});
      var [isCustomer,licenseId, licenseValidateTime, licenseStartTime, licenseValidate  ] = await license.getLicenseInfo(app2,{from: customer2});
      console.log(licenseInfo(isCustomer,licenseId, licenseValidateTime, licenseStartTime, licenseValidate));
      await new Promise((resolve, reject) => {
          setTimeout(()=>{
            resolve();
          }, 10*1000);
      });
      [isCustomer,licenseId, licenseValidateTime, licenseStartTime, licenseValidate  ] = await license.getLicenseInfo(app2,{from: customer2});
      console.log(licenseInfo(isCustomer,licenseId, licenseValidateTime, licenseStartTime, licenseValidate));
      licenseValidate.should.equal(false);
      console.log("develop1", web3.eth.getBalance(develop1).toNumber());
      console.log("customer2", web3.eth.getBalance(customer2).toNumber());

    });
    it('user reapply to update license which would cover exist one', async () => {
      console.log("develop1", web3.eth.getBalance(develop1).toNumber());
      console.log("customer2", web3.eth.getBalance(customer2).toNumber());
      var [isCustomer,licenseId, licenseValidateTime, licenseStartTime, licenseValidate  ] = await license.getLicenseInfo(app2,{from: customer2});
      console.log(licenseInfo(isCustomer,licenseId, licenseValidateTime, licenseStartTime, licenseValidate));
      await license.applyLicense(app2, 1, {from: customer2, value: 2 * ether});
      [isCustomer,licenseId, licenseValidateTime, licenseStartTime, licenseValidate  ] = await license.getLicenseInfo(app2,{from: customer2});
      console.log(licenseInfo(isCustomer,licenseId, licenseValidateTime, licenseStartTime, licenseValidate));
      licenseId.toNumber().should.equal(1);
      console.log("develop1", web3.eth.getBalance(develop1).toNumber());
      console.log("customer2", web3.eth.getBalance(customer2).toNumber());

    });
    it('get an app clientList owned by yourself', async () => {
      const [ name,  licenseTypeNum, customersNum] = await license.getAppBrief(0,{from: develop1});
      const [ customerAddrs,customerLicenseIds, customerLicenseStartTimes ] = await license.getAppCustomerList(0,{from: develop1});

      console.log(name,  licenseTypeNum.toNumber(),  customersNum.toNumber(), customerAddrs, customerLicenseIds, customerLicenseStartTimes );
      customersNum.toNumber().should.equal(customerAddrs.length);
    });



  });


});
