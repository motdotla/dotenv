SUPPORTED SPECIFICATIONS
========================

* [BIP-13](https://github.com/bitcoin/bips/blob/master/bip-0013.mediawiki): Address format for pay-to-script-hash
* [BIP-14](https://github.com/bitcoin/bips/blob/master/bip-0014.mediawiki): Protocol version and user agent
* [BIP-21](https://github.com/bitcoin/bips/blob/master/bip-0021.mediawiki): URI scheme for making Bitcoin payments
* [BIP-31](https://github.com/bitcoin/bips/blob/master/bip-0031.mediawiki): Pong message
* [BIP-32](https://github.com/bitcoin/bips/blob/master/bip-0032.mediawiki): Hierarchical deterministic wallets
* [BIP-35](https://github.com/bitcoin/bips/blob/master/bip-0035.mediawiki): Mempool message
* [BIP-37](https://github.com/bitcoin/bips/blob/master/bip-0037.mediawiki): Connection bloom filtering
* [BIP-38](https://github.com/bitcoin/bips/blob/master/bip-0038.mediawiki): Passphrase-protected private key
* [BIP-43](https://github.com/bitcoin/bips/blob/master/bip-0043.mediawiki): Purpose field for deterministic wallets
* [BIP-66](https://github.com/bitcoin/bips/blob/master/bip-0066.mediawiki): Strict DER signatures
* [BIP-70](https://github.com/bitcoin/bips/blob/master/bip-0070.mediawiki): Payment protocol
* [BIP-71](https://github.com/bitcoin/bips/blob/master/bip-0071.mediawiki): Payment protocol MIME types
* [BIP-111](https://github.com/bitcoin/bips/blob/master/bip-0111.mediawiki): NODE_BLOOM service bit
* [BIP-141](https://github.com/bitcoin/bips/blob/master/bip-0141.mediawiki): Segregated Witness (Consensus layer)
* [BIP-143](https://github.com/bitcoin/bips/blob/master/bip-0143.mediawiki): Transaction Signature Verification for Version 0 Witness Program
* [BIP-144](https://github.com/bitcoin/bips/blob/master/bip-0144.mediawiki): Segregated Witness (Peer Services)
* [BIP-159](https://github.com/bitcoin/bips/blob/master/bip-0159.mediawiki): NODE_NETWORK_LIMITED service bit
* [BIP-173](https://github.com/bitcoin/bips/blob/master/bip-0173.mediawiki): Base32 address format for native v0-16 witness outputs
* [RFC 6979](https://tools.ietf.org/html/rfc6979): Deterministic usage of ECDSA


## UNSUPPORTED OR PARTIALLY SUPPORTED SPECIFICATIONS

[BIP-44](https://github.com/bitcoin/bips/blob/master/bip-0044.mediawiki): Multi-account hierarchy for deterministic wallets

We deliberately chose not to support multiple accounts per wallet. As BIP-44 requires supporting
multiple accounts, we are using BIP-32 instead. This implies wallets can't be shared between
BIP-32 and BIP-44 compatible wallets, as they would see a different transaction history for the
same seed.

[BIP-72](https://github.com/bitcoin/bips/blob/master/bip-0072.mediawiki): `bitcoin:` URI extensions for payment protocol

The spec is supported, except the _"...it should ignore the bitcoin address/amount/label/message in
the URI..."_ part of the recommendation. Important: If you use the request parameter, you have one
of the following choices. If you don't follow one of those, your linked payment request won't be
accepted.
1. Supply an address and optionally an `amount` parameter, with their values exactly matching the
   respective values from the linked payment request message. This means there can be only one
   output in `PaymentDetails.outputs` and that output can only contain an `Output.script` of type
   `pay-to-pubkey`, `pay-to-pubkey-hash`, `pay-to-witness-pubkey-hash` or `pay-to-script-hash`. Note you should add these parameters
   anyway for backwards compatibility to wallets that don't support the payment protocol.
2. Supply an `h` parameter, which contains the unpadded base64url-encoded SHA-256 hash of the
   linked payment request bytes.


(these lists are not exhaustive)
