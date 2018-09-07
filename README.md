# licenseContract

This is a smart contract aims to give a solution on license applying/charging between clients and app owner, based Ethereum Block chain.

Also is an open contract to prove client already applied/paid for your app, app owner should supply relative service.


Here supply dapp for testing this contract, which  implement follow functions:

  1. ethereum accout generate/keystore login/ private key login

  2. transaction in web without metamask(not support metamask yet)

  3. licenseContract method calling(detail move to contract method part)

  4. ethernetwork switch

  5. international language (Chinese/English)



   ![image](https://raw.githubusercontent.com/wu2009/licenseContract/master/portal/images/introduction/login.png)

   ![image](https://raw.githubusercontent.com/wu2009/licenseContract/master/portal/images/introduction/home.png)

   try visit to experience/test the dapp contract

      [IPFS gateway](https://ipfs.io/ipfs/QmaMYzALCo7Nv6W947cRfdhxCCw9AjexGE7h5Jq4PZEC23)

      [IPFS gateway when blocked](https://ipfs.infura.io/ipfs/QmaMYzALCo7Nv6W947cRfdhxCCw9AjexGE7h5Jq4PZEC23)

# contract method

    ## for app-develop

      `
        function createFreeApp(string _name) external payable whenNotPaused {}

        function createApp(string _name,uint256[] _licenseFees, uint256[] _licenseValidateTimes ) external payable whenNotPaused {}

        function getYourApps() external view returns(uint256[]) {}

        function getAppBrief(uint256 _appId) external view isAppOwner(_appId)  returns(string , uint256 ,  uint256) {}  

        function getAppLicenseList(uint256 _appId) external view isAppOwner(_appId)  returns( uint256[] , uint256[] ) {}

        function getAppCustomerList(uint256 _appId) external view isAppOwner(_appId) returns( address[], uint256[] , uint256[]  ){}

      `
    ## for client

      `
        function aCustomer(uint256 _appId) public view returns(bool isCustomer, uint256 customerId){}

        function applyLicense (uint256 _appId,uint256 _licenseId) external payable whenNotPaused {}    

        function getLicenseInfo(uint256 _appId) external view returns(bool isCustomer, uint256 licenseId,  uint256 licenseValidateTime, uint256 licenseStartTime, bool licenseValidate ){}

      `

    ## for contract owner

      `
        function getAllApps() external view  onlyOwner returns(uint256[]) {}

        function pause() onlyOwner whenNotPaused public {}

        function unpause() onlyOwner whenPaused public {}

        function transferOwnership(address newOwner) public onlyOwner {}

        ......

      `
        contract migration/update method  support by zos-lib which make this contract upgradeable(only add feature/status, can not delete)


    ## events

      `

         event NewApp(uint256 _creationTime, address  _creator, uint256  _appId, string _appName, uint256[] _licenseFees, uint256[]  _licenseValidateTimes)

         event NewCustomer(uint256 _applyTime, address indexed _applior, uint256 indexed _appId,  uint256 indexed _licenseId, uint256 _licenseFee, uint256 _licenseValidateTime, uint256 _LicenseStartTime)

         event UpdateCustomer(uint256 _updateTime,address indexed _applior,  uint256 indexed _appId, uint256 _oldLicenseId, uint256 _oldLicenseStartTime, uint256 indexed _newLicenseId,  uint256 _newLicenseFee, uint256 _newLicenseValideTime, uint256 _newLicenseStartTime)


      `

# test contract
    `
      npm i
      npm run test
    `

# reference

    zeppelinos

    openzeppelin

    metamask
