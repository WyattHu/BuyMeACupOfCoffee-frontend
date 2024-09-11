import { contractAddresses, abi } from "../constants";
// dont export from moralis when using react
import { useMoralis, useWeb3Contract } from "react-moralis";
import { useEffect, useState } from "react";
import { useNotification } from "web3uikit";
import { ethers } from "ethers";

export default function BuyMeACupOfCoffee() {
  const { Moralis, isWeb3Enabled, chainId: chainIdHex } = useMoralis();
  // These get re-rendered every time due to our connect button!
  const chainId = parseInt(chainIdHex);
  // console.log(`ChainId is ${chainId}`)
  const contractAddress =
    chainId in contractAddresses ? contractAddresses[chainId][0] : null;

  // State hooks
  // https://stackoverflow.com/questions/58252454/react-hooks-using-usestate-vs-just-variables
  const [addressToAmountFunded, setaddressToAmountFunded] = useState("0");
  const [boss, setboss] = useState("0");
  const [fundedLength, setfundedLength] = useState("0");

  const dispatch = useNotification();

  const {
    runContractFunction: fund,
    data: enterTxResponse,
    isLoading,
    isFetching,
  } = useWeb3Contract({
    abi: abi,
    contractAddress: contractAddress,
    functionName: "fund",
    msgValue: ethers.utils.parseEther("0.1"),
    params: {},
  });

  /* View Functions */

  const { runContractFunction: getAddressToAmountFunded } = useWeb3Contract({
    abi: abi,
    contractAddress: contractAddress, // specify the networkId
    functionName: "getAddressToAmountFunded",
    params: { bossAddress: "0x294e0bCC654D249eA6EF17f9f83d20B58999C921" },
  });

  const { runContractFunction: getBoss } = useWeb3Contract({
    abi: abi,
    contractAddress: contractAddress,
    functionName: "getBoss",
    params: { index: 0 },
  });

  const { runContractFunction: getFundedLength } = useWeb3Contract({
    abi: abi,
    contractAddress: contractAddress,
    functionName: "getFundedLength",
    params: {},
  });

  async function updateUIValues() {
    // Another way we could make a contract call:
    // const options = { abi, contractAddress: raffleAddress }
    // const fee = await Moralis.executeFunction({
    //     functionName: "getEntranceFee",
    //     ...options,
    // })
    const fundedLengthFromCall = (await getFundedLength()).toString();
    setfundedLength(fundedLengthFromCall);
    const bossLength = parseInt(fundedLengthFromCall);
    console.log(bossLength);

    if (bossLength > 0) {
      const bossFromCall = await getBoss();
      setboss(bossFromCall);
      console.log(bossFromCall);
      const addressToAmountFundedFromCall = await getAddressToAmountFunded();
      setaddressToAmountFunded(addressToAmountFundedFromCall);
      console.log(addressToAmountFundedFromCall);
    }
  }

  useEffect(() => {
    if (isWeb3Enabled) {
      updateUIValues();
    }
  }, [isWeb3Enabled]);

  // no list means it'll update everytime anything changes or happens
  // empty list means it'll run once after the initial rendering
  // and dependencies mean it'll run whenever those things in the list change

  // An example filter for listening for events, we will learn more on this next Front end lesson
  // const filter = {
  //     address: raffleAddress,
  //     topics: [
  //         // the name of the event, parnetheses containing the data type of each event, no spaces
  //         utils.id("RaffleEnter(address)"),
  //     ],
  // }

  const handleNewNotification = () => {
    dispatch({
      type: "info",
      message: "Transaction Complete!",
      title: "Transaction Notification",
      position: "topR",
      icon: "bell",
    });
  };

  const handleSuccess = async (tx) => {
    try {
      await tx.wait(1);
      updateUIValues();
      handleNewNotification(tx);
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <div className="p-5">
      <h1 className="py-4 px-4 font-bold text-3xl">Halo!</h1>
      {contractAddress ? (
        <>
          <button
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded ml-auto"
            onClick={async () =>
              await fund({
                // onComplete:
                // onError:
                onSuccess: handleSuccess,
                onError: (error) => console.log(error),
              })
            }
            disabled={isLoading || isFetching}
          >
            {isLoading || isFetching ? (
              <div className="animate-spin spinner-border h-8 w-8 border-b-2 rounded-full"></div>
            ) : (
              "Fund"
            )}
          </button>
          <div>
            The last funded amount:{" "}
            {ethers.utils.formatUnits(addressToAmountFunded, "ether")} ETH
          </div>
          <div>The last boss is: {boss}</div>
          <div>The count of bosses: {fundedLength}</div>
        </>
      ) : (
        <div>Please connect to a supported chain </div>
      )}
    </div>
  );
}
