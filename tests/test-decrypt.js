const t = require('tap')

const dotenv = require('../lib/main')

t.test('can decrypt', ct => {
  ct.plan(1)

  const encrypted = 's7NYXa809k/bVSPwIAmJhPJmEGTtU0hG58hOZy7I0ix6y5HP8LsHBsZCYC/gw5DDFy5DgOcyd18R'
  const keyStr = 'ddcaa26504cd70a6fef9801901c3981538563a1767c297cb8416e8a38c62fe00'

  const result = dotenv.decrypt(encrypted, keyStr)

  ct.equal(result, '# development@v6\nALPHA="zeta"')
})

t.test('throws on short key', ct => {
  ct.plan(1)

  const encrypted = 's7NYXa809k/bVSPwIAmJhPJmEGTtU0hG58hOZy7I0ix6y5HP8LsHBsZCYC/gw5DDFy5DgOcyd18R'

  try {
    dotenv.decrypt(encrypted, 'tooshort')
  } catch (e) {
    ct.equal(e.code, 'INVALID_DOTENV_KEY', 'throws INVALID_DOTENV_KEY for short key')
  }
})

t.test('throws DECRYPTION_FAILED on wrong key', ct => {
  ct.plan(1)

  const encrypted = 's7NYXa809k/bVSPwIAmJhPJmEGTtU0hG58hOZy7I0ix6y5HP8LsHBsZCYC/gw5DDFy5DgOcyd18R'
  const wrongKey = 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'

  try {
    dotenv.decrypt(encrypted, wrongKey)
  } catch (e) {
    ct.equal(e.code, 'DECRYPTION_FAILED', 'throws DECRYPTION_FAILED for wrong key')
  }
})
