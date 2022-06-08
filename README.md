
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

- Address Whitelist


## Install

To use any of the helpers provided by this library:

1. Install this library as an npm package. Run this command in your scene's project folder:

   ```
   npm install dcl-access-area
   ```

2. Install the following dependency libraries, if not already in your project:

   ```
   npm install @dcl/crypto-scene-utils @dcl/ecs-scene-utils eth-connect @dcl/ui-scene-utils -B
   ```

3. Add this line at the start of your game.ts file, or any other TypeScript files that require it:

   ```ts
   import * as access from 'dcl-access-area'
   ```

## Usage

Create an access area to block any players that don't meet the criteria from being able to enter an area. Players that don't meet the criteria will meet an invisible blocker that will prevent them from walking into the area.

<!-- 
You can configure an area to display a notification whenever a player does not meet the criteria, to make it clear to them why they could not enter, or what they need to do to enter. You can also provide a custom function to be called every time that the player runs into the area, for example to play a sound or to give feedback in any other way that makes sense.
-->

### Configuration

When creating a new area, pass in a Config object with the following parameters depending on your access requirements:
- `transform`: pass in the `TransformConstructorArgs` to position, rotate, and scale the access area
- `debug`: a `boolean` value to toggle showing / hiding the access area locally when testing. When true, the area is visible but doesn't block players from walking into it.
- `type`: Type of access area. Options are:
   - `NFT`
   - `HASWEARABLES`
   - `WEARABLESON`
- `nftType`: (optional) to choose between `ERC721` and `ERC1155` nft token standards
- `contract`: (optional) for the nft contract address
- `tokenId`: (optional) for the nft token id
- `chain`: (optional) to choose between ETH and Polygon chains
- `allowedAddresses`: (optional) arry of eth addresses who will have access to the area `["0xf87a8372437c40ef9176c1b224cbe9307a617a25"]`
- `wearables`: (optional) array of wearable contract addresses and their item id eg. `["urn:decentraland:matic:collections-v2:0xf87a8372437c40ef9176c1b224cbe9307a617a25:1"]`
- `wearablesMatch`: (optional) to filter based on if the user has `ANY` or `ALL` of the wearables given in the array
- `name`: (optional) parameter to give a name to your entity
- `deniedMessage`: (optional) parameter to display a message to the user if they are denied access
- `onDenied`: (optional) callback function when a user is denied access

   - **DO NOT FORGET TO SET TO DEBUG TO FALSE BEFORE DEPLOYING**

### Check NFT Ownership on ETH (721)

Create an access area and check if users **own at least 1** nft from the contract address.

```ts
import * as access from 'dcl-access-area'

let wall = access.createArea({
    transform: {position: new Vector3(8,1,8), scale: new Vector3(4,4,4)},
    debug: true,
    type: access.Type.NFT,
    nftType: access.NFTType.ERC721,
    chain: access.ChainType.ETH,
    contract: "0xf23e1aa97de9ca4fb76d2fa3fafcf4414b2afed0",
    name: "wall1",
    deniedMessage: "You don't own the required token"
})
```

### Check NFT Ownership on ETH (1155)

Create an access area and check if users **own at least 1** nft from the contract address.

```ts
import * as access from 'dcl-access-area'

let wall = access.createArea({
    transform: {position: new Vector3(8,1,8), scale: new Vector3(4,4,4)},
    debug: true,
    type: access.Type.NFT,
    nftType: access.NFTType.ERC1155,
    chain: access.ChainType.ETH,
    contract: "0x10daa9f4c0f985430fde4959adb2c791ef2ccf83",
    tokenId: "1",
    name: "wall1",
    deniedMessage: "You don't own the required token"
})
```

### Check User Wearing Wearables

Create an access area and check if users are currently wearing the wearables. Use the `wearablesMatch` option to create a filter based on the user wearing `ALL` or `ANY`

```ts
import * as access from 'dcl-access-area'

let wall = access.createArea({
    transform: {position: new Vector3(8,1,8), scale: new Vector3(4,4,4)},
    debug: true,
    type: access.Type.WEARABLESON,
    wearables:["urn:decentraland:matic:collections-v2:0xf87a8372437c40ef9176c1b224cbe9307a617a25:1"],
    name: "wall1",
    deniedMessage: "You don't match the dress code"
})
```


### Check User Owns Wearables

Create an access area and check if users are currently owns the wearables. Use the `wearablesMatch` option to create a filter based on the user owning `ALL` or `ANY`

```ts
import * as access from 'dcl-access-area'

let wall = access.createArea({
    transform: {position: new Vector3(8,1,8), scale: new Vector3(4,4,4)},
    debug: true,
    type: access.Type.HASWEARABLES,
    wearables:["urn:decentraland:matic:collections-v2:0xf87a8372437c40ef9176c1b224cbe9307a617a25:0", "urn:decentraland:matic:collections-v2:0xf87a8372437c40ef9176c1b224cbe9307a617a25:1"],
    wearablesMatch: access.Match.ALL,
    name: "wall1",
    deniedMessage: "You don't own the required wearables"
})
```

### Check Player Address

Create an access area and check if the player's eth address belongs to a hardcoded allow-list. Use the `allowedAddresses` option to create a filter based on the user's address.

```ts
let wall = access.createArea({
    transform: {position: new Vector3(8,1,8), scale: new Vector3(4,4,4)},
    debug: false,
    type: access.Type.ADDRESS,
	allowedAddresses: ["123456789"],
    name: "wall1"
    deniedMessage: "You're not in the guest list"
})
```


## Copyright info

This scene is protected with a standard Apache 2 licence. See the terms and conditions in the [LICENSE](/LICENSE) file.
