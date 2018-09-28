const BigNumber = web3.BigNumber;
require('chai')
  .use(require('chai-bignumber')(BigNumber))
  .use(require('chai-as-promised'))
.should();
const AppFactory = artifacts.require('AppFactory');
contract('AppFactory', accounts => {
  let ether = Math.pow(10,18); // wei
  let dayUnit = 24 * 60 * 60; // second
  const deployer = accounts[1];
  const develop1 = accounts[2];
  const develop2 = accounts[3];
  let appFactory = null;

  beforeEach(async () => {
    if(appFactory==null){
      appFactory = await AppFactory.new();
      await appFactory.initialize(deployer);
      await appFactory.setAppFee(0.01 * ether,{from: deployer});
      var a = await appFactory.appFee();
      console.log(a,"werewrewrewrewr");
    }
  });

  describe('AppFactory', () => {
    it('owner', async () => {
      await appFactory.owner().should.eventually.be.equal(deployer);
    });
    it('zero app', async () => {
      const appIds = await appFactory.getAllApps({ from: deployer });
      appIds.length.should.equal(0);
    });
    it('create app successful', async () => {
      const preAppIds = await appFactory.getYourApps({from:develop1});
      console.log(web3.eth.getBalance(develop1).toNumber());
      await Promise.all([
          appFactory.createFreeApp("test1",{from: develop1,value: 0.01 * ether}),
          appFactory.createFreeApp("test2",{from: develop1,value: 1 * ether})
      ]);
      console.log(web3.eth.getBalance(develop1).toNumber());
      const appIds = await appFactory.getYourApps({from:develop1});
      appIds.length.should.equal(preAppIds.length + 2);
    });
    it('create app fail when the sender does not pay enough fee', async () => {
      console.log(web3.eth.getBalance(develop2).toNumber());
      try {
        await appFactory.createFreeApp("test3",{from: develop2,value: 0.001 * ether});
      } catch (error) {
        const revertFound = error.message.search('revert') >= 0;
        assert(revertFound, `Expected "revert", got ${error} instead`);
      }
      console.log(web3.eth.getBalance(develop2).toNumber());
      const appIds = await appFactory.getYourApps({from:develop2});
      appIds.length.should.equal(0);
    });
    it('get apps of certain developer', async () => {
       const appIds = await appFactory.getYourApps({from:develop1});
       appIds.length.should.equal(2);
    });

    it('get all apps', async () => {
       await appFactory.createFreeApp("test4",{from: develop2,value: 0.01 * ether});
       const appIds = await appFactory.getAllApps({ from: deployer });
       appIds.length.should.equal(3);
    });

    it('get an app licenseList owned by yourself', async () => {
      const [ name,  licenseTypeNum, customersNum] = await appFactory.getAppBrief(0,{from: develop1});
      const [ licenseFees, licenseValidateTimes] = await appFactory.getAppLicenseList(0,{from: develop1});
      // const [ customerAddrs,customerLicenseIds, customerLicenseStartTimes ] = await appFactory.getAppCustomerList(0,{from: develop1});

      // console.log(name,  licenseTypeNum.toNumber(),  customersNum.toNumber(), licenseFees, licenseValidateTimes, customerAddrs, customerLicenseIds, customerLicenseStartTimes );
       licenseTypeNum.toNumber().should.equal(licenseFees.length);
       // customersNum.toNumber().should.equal(customerAddrs.length);
    });

    it('contract pause/unpause control by admin', async () => {
       await appFactory.pause({from: deployer});
       try {
         await appFactory.createFreeApp("test5",{from: develop1,value: 0.01 * ether});
       } catch (error) {
         console.log(error);
         const revertFound = error.message.search('revert') >= 0;
         assert(revertFound, `Expected "revert", got ${error} instead`);
         var appIds = await appFactory.getAllApps({ from: deployer });
         appIds.length.should.equal(3);

         await appFactory.unpause({from: deployer});
         await appFactory.createFreeApp("test6",{from: develop1,value: 0.01 * ether});

         appIds = await appFactory.getAllApps({ from: deployer });
         appIds.length.should.equal(4);

       }

    });

    it('the appowner could control cetain LicenseTypes online/offline', async () => {
       var [ licenseFees, licenseValidateTimes, licenseOfflines] = await appFactory.getAppLicenseList(0,{from: develop1});
       var preState = (licenseOfflines[0]);
       await appFactory.setAppLicenseOnlineStates(0,[0],[true], {from: develop1});
      [ licenseFees, licenseValidateTimes, licenseOfflines] = await appFactory.getAppLicenseList(0,{from: develop1});
       var currentState = (licenseOfflines[0]);
       preState.should.equal(!currentState);
    });
  });

});
