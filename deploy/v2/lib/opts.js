const CHIMERA = "0x610c92c70eb55dfeafe8970513d13771da79f2e0";

function genParams(dh, params = {}) {
  let addresses = {
    multisigAddr: CHIMERA, // todo: mainnet fix, currently deployer addr
    deployer: dh.address,
    nor: dh.address,
    feeCalcAddr: dh.addressOf(0), // 0x00 address since initial fees = 0
  };

  let GoerliDeployedAddresses = {
    vETH2Addr: "0x0d3c0916b0df1ae387eda7fd1cb77d2e244826e6",
    sgETH: "0x453B459249F82ba3f369651aD485Fa11C6F082F8",
    wsgETH: "0xbFA813C3266Af70A5Ddc15d9253655281e2bCd23",
    rewardsReceiver: "0xC9F2ddBf105ff67c2BA30b2dB968Bc564a16ca67",
  }

  params = {
    epochLen: 24 * 60 * 60, // 1 day
    numValidators: 10000,
    adminFee: 0,
    sgETHVirtualPrice: "1000000000000000000",
    rolloverVirtual: "1100000000000000000",
    names: {
      minter: "SharedDepositMinterV2",
      sgETH: "SgETH",
      wsgETH: "WSGETH",
      withdrawals: "Withdrawals",
      rewardsReceiver: "RewardsReceiver",
      daoFeeSplitter: "PaymentSplitter",
      yd: "YieldDirector",
      timelock: "TimelockController",
    },
    ...addresses,
    ...GoerliDeployedAddresses,
    ...params
  };

  params.daoFeeSplitterDistro = genFeeDistro(params);
  params.timelockParams = genTimelockParams(params);

  console.log("Using params: ", params)

  return params;
}

let genTimelockParams = (params) => {
  let timelockParams = {
    delay: 60,
    proposers: [params.multisigAddr, params.deployer],
    executors: [params.multisigAddr],
    admin: params.multisigAddr
  }

  return timelockParams;
}

let genFeeDistro = (params) => {
  // 9% Fees to start. 
  // 5% to node operator, 
  // 1% to founder, 
  // 3% to dao multisig, 
  // rest reflected back to stakers
  let daoFeeSplitterDistro = {
    founder: 1,
    nor: 5,
    dao: 3,
    reflection: 31,
  };
  let currentYieldPercentageReceived = 40; // max fees can go to this % of yield theoretically as its recvd by the dao fee splitter
  daoFeeSplitterDistro.values = prctGlobalToPartOfPrctLocal(daoFeeSplitterDistro, currentYieldPercentageReceived);
  daoFeeSplitterDistro.addresses = [
    params.deployer,
    params.multisigAddr,
    params.wsgETH
  ]

  return daoFeeSplitterDistro;
}

let prctGlobalToPartOfPrctLocal = (argsObj, partOf) => {
  // call with daoFeeSplitterDistro and partOf = what perct the splitter gets. e.g. 40 if it gets 40%
  // converts daoFeeSplitterDistro as a part of 100% of fees
  // to args for the splitter as part of fees
  // 6% of 100% is (6 * 5) or 30% or (6 * 100 / part) of 20%
  // $6 = (100 * 0.3 * 0.2)
  let scalingFactor = (100 / partOf) * 10; // 300 if partof is 20
  argsObj = {
    operator: (argsObj.founder + argsObj.nor) * scalingFactor,
    daoPay: argsObj.dao * scalingFactor,
    reflectionPay: argsObj.reflection * scalingFactor,
  };
  return [argsObj.operator, argsObj.daoPay, argsObj.reflectionPay];
};

module.exports = genParams;