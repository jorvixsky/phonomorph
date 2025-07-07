import { type Chain } from "viem";
import { http, createConfig } from "wagmi";

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