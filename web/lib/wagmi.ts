import { type Chain } from "viem";
import { http, createConfig } from "wagmi";

// USDT Token on Morph Holesky
export const morphismUSDT = {
    address: "0x9E12AD42c4E4d2acFBADE01a96446e48e6764B98",
    decimals: 18,
    name: "Morphism USDT",
    symbol: "USDT",
} as const

// const morph = {
//     id: 2818,
//     name: "Morph",
//     rpcUrls: {
//         default: {
//             http: ["https://rpc-quicknode.morphl2.io/"],
//         },
//     },
//     blockExplorers: {
//         default: {
//             name: "Morph",
//             url: "https://explorer.morphl2.io",
//         },
//     },
//     nativeCurrency: {
//         decimals: 18,
//         name: "Ethereum",
//         symbol: "ETH",
//     },
// } as const satisfies Chain

const morphHolesky = {
    id: 2810,
    name: "Morph Holesky Testnet",
    rpcUrls: {
        default: {
            http: ["https://rpc-quicknode-holesky.morphl2.io"],
        },
    },
    blockExplorers: {
        default: {
            name: "Morph H",
            url: "https://explorer-holesky.morphl2.io",
        },
    },
    nativeCurrency: {
        decimals: 18,
        name: "Ethereum",
        symbol: "ETH",
    },
} as const satisfies Chain

export const wagmiConfig = createConfig({
    chains: [morphHolesky],
    transports: {
        [morphHolesky.id]: http(),
    },
})