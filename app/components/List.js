import { ethers } from "ethers";

function List({ toggleCreate, fee, provider, factory }) {
  return (
    <div className="list">
      <p>Create token</p>

      <button onClick={toggleCreate} className="btn--fancy">
        [ cancel ]
      </button>
    </div>
  );
}

export default List;
