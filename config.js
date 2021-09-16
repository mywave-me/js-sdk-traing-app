const {MWSdk, MWSdkConfig, Date: MWDate, ValidationResult} = mywaveAiJsSdk
const mwSdkConfig = new MWSdkConfig('https://mywave-ai-training-be.app.mywave.me', 'https://mywave-ai-training-pps.app.mywave.me')
 
mwSdkConfig.withDetectEntityUpdatesInterval(30000)
  .withRequestTimeOut(10000)
  .withServiceUnavailableTimeOut(3000)
  .withSecurityTokenRefreshedOffset(120000)
  .withBackoffIntervalOnWaitingLiveAgentResponse(3000)

var mwSdk = new MWSdk(mwSdkConfig)
  