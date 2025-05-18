import { useEffect, useState } from "react";
import { ethers } from "ethers";

function Trade({ toggleTrade, token, provider, factory }) {
  const [target, setTarget] = useState(0);
  const [limit, setLimit] = useState(0);
  const [cost, setCost] = useState(0);

  // Tambahkan class modal-open ke body saat komponen dimuat
  useEffect(() => {
    document.body.classList.add('modal-open');
    
    // Hapus class saat komponen di-unmount
    return () => {
      document.body.classList.remove('modal-open');
    };
  }, []);

  async function buyHandler(form) {
    const amount = form.get("amount");

    const cost = await factory.getCost(token.sold);

    const totalCost = cost * BigInt(amount);

    const signer = await provider.getSigner();

    const transaction = await factory
      .connect(signer)
      .buy(token.token, ethers.parseUnits(amount, 18), {
        value: totalCost,
      });
    transaction.wait();
  }

  async function getSaleDetails() {
    const target = await factory.TARGET();
    setTarget(target);

    const limit = await factory.TOKEN_LIMIT();
    setLimit(limit);

    const cost = await factory.getCost(token.sold);
    setCost(cost);
  }

  useEffect(() => {
    getSaleDetails();
  }, []);

  const handleCancel = (e) => {
    e.preventDefault();
    toggleTrade();
  };

  return (
    <div className="trade">
      <h2>trade</h2>

      <div className="token__details">
        <p className="name">{token.name}</p>
        <p>
          creator:{" "}
          {token.creator.slice(0, 6) + "..." + token.creator.slice(38, 42)}
        </p>
        <img src={token.image} alt={token.name} width={256} height={256} />
        <p>market cap: {ethers.formatUnits(token.raised, 18)} ETH</p>
        <p>base cost: {ethers.formatUnits(cost, 18)} ETH</p>
      </div>

      {token.sol >= limit || token.raised >= target ? (
        <div>
          <p className="disclaimer">target reached!</p>
          <button 
            type="button" 
            onClick={handleCancel} 
            className="btn--fancy"
          >
            [ cancel ]
          </button>
        </div>
      ) : (
        <form action={buyHandler}>
          <input
            type="number"
            name="amount"
            min={1}
            max={10000}
            placeholder="1"
          />
          <div className="list-buttons">
            <input type="submit" value="[ buy ]" />
            <button 
              type="button" 
              onClick={handleCancel} 
              className="btn--fancy"
            >
              [ cancel ]
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

export default Trade;
