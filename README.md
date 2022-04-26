
# dcl-access-area

This libary makes it easy to create 'restricted' areas within your scene based on different parameters. Some of these parameters are:

- NFT Ownership
   - ETH or Polygon
   - ERC 721
   - ERC 1155

- Wearables

   - Is a user wearing certain wearables
   - Does a user own certain wearables
   - Filter by 'has all'
   - Filter by 'has any' 


## Install

To use any of the helpers provided by this library:

1. Install this library as an npm package. Run this command in your scene's project folder:

   ```
   npm install dcl-access-area
   ```

2. Install the following dependency libraries, if not already in your project:

   ```
   npm install @dcl/crypto-scene-utils @dcl/ecs-scene-utils eth-connect -B
   ```

3. Add this line at the start of your game.ts file, or any other TypeScript files that require it:

   ```ts
   import * as access from 'dcl-access-area'
   ```

## Usage

Create an access area to block any players that don't meet the criteria from being able to enter an area

### Configuration

The access area takes in a Config object with the following parameters depending on your access requirements:

- `name`: (optional) parameter to give a name to your entity
- `contract`: (optional) for the nft contract address
- `tokenId`: (optional) for the nft token id
- `chain'`: (optional) to choose between ETH and Polygon chains
- `nftType`: (optional) to choose between `ERC721` and `ERC1155` nft token standards
- `wearables`: (optional) array of wearable contract addresses and their item id eg. `["0xf87a8372437c40ef9176c1b224cbe9307a617a25:1"]`
- `wearablesMatch`: (optional) to filter based on if the user has `ANY` or `ALL` of the wearables given in the array
- `type`: Type of access area. Options are:
   - `NFT`
   - `HASWEARABLES`
   - `WEARABLESON`
- `transform`: pass in the `TransformConstructorArgs` to position, rotate, and scale the access area
- `debug`: a `boolean` value to toggle showing / hiding the access area locally when testing
   - **DO NOT FORGET TO SET TO FALSE BEFORE DEPLOYING**

### Check NFT Ownership on ETH (721)

Create an access area and check if users **own at least 1** nft from the contract address.

```ts
import * as access from 'dcl-access-area'

let wall = access.createArea({
    debug: true,
    name: "wall1",
    type: access.Type.NFT,
    nftType: access.NFTType.ERC721,
    chain: access.ChainType.ETH,
    contract: "0xf23e1aa97de9ca4fb76d2fa3fafcf4414b2afed0",
    transform: {position: new Vector3(8,1,8), scale: new Vector3(4,4,4)}
})
```

### Check NFT Ownership on ETH (1155)

Create an access area and check if users **own at least 1** nft from the contract address.

```ts
import * as access from 'dcl-access-area'

let wall = access.createArea({
    debug: true,
    name: "wall1",
    type: access.Type.NFT,
    nftType: access.NFTType.ERC1155,
    chain: access.ChainType.ETH,
    contract: "0x10daa9f4c0f985430fde4959adb2c791ef2ccf83",
    tokenId: "1",
    transform: {position: new Vector3(8,1,8), scale: new Vector3(4,4,4)}
})
```

### Check User Wearing Wearables

Create an access area and check if users are currently wearing the wearables. Use the `wearablesMatch` option to create a filter based on the user wearing `ALL` or `ANY`

```ts
import * as access from 'dcl-access-area'

let wall = access.createArea({
    debug: true,
    name: "wall1",
    type: access.Type.WEARABLESON,
    wearables:["0xf87a8372437c40ef9176c1b224cbe9307a617a25:1"],
    transform: {position: new Vector3(8,1,8), scale: new Vector3(4,4,4)}
})
```


### Check User Owns Wearables

Create an access area and check if users are currently owns the wearables. Use the `wearablesMatch` option to create a filter based on the user owning `ALL` or `ANY`

```ts
import * as access from 'dcl-access-area'

let wall = access.createArea({
    debug: true,
    name: "wall1",
    type: access.Type.HASWEARABLES,
    wearables:["0xf87a8372437c40ef9176c1b224cbe9307a617a25:0", "0xf87a8372437c40ef9176c1b224cbe9307a617a25:1"],
    wearablesMatch: access.Match.ALL,
    transform: {position: new Vector3(8,1,8), scale: new Vector3(4,4,4)}
})
```


## Copyright info

This scene is protected with a standard Apache 2 licence. See the terms and conditions in the [LICENSE](/LICENSE) file.
