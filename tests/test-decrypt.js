const t = require('tap')

const dotenv = require('../lib/main')

t.test('can decrypt', ct => {
  ct.plan(1)

  const encrypted = 's7NYXa809k/bVSPwIAmJhPJmEGTtU0hG58hOZy7I0ix6y5HP8LsHBsZCYC/gw5DDFy5DgOcyd18R'
  const keyStr = 'ddcaa26504cd70a6fef9801901c3981538563a1767c297cb8416e8a38c62fe00'

  const result = dotenv.decrypt(encrypted, keyStr)

  ct.equal(result, '# development@v6\nALPHA="zeta"')
})

t.test('throws INVALID_DOTENV_KEY when key is too short', ct => {
  ct.plan(2)

  const encrypted = 's7NYXa809k/bVSPwIAmJhPJmEGTtU0hG58hOZy7I0ix6y5HP8LsHBsZCYC/gw5DDFy5DgOcyd18R'
  const shortKey = 'abcd1234'

  try {
    dotenv.decrypt(encrypted, shortKey)
    ct.fail('should have thrown')
  } catch (e) {
    ct.equal(e.code, 'INVALID_DOTENV_KEY')
    ct.match(e.message, 'INVALID_DOTENV_KEY')
  }
})

t.test('throws DECRYPTION_FAILED when key is wrong', ct => {
  ct.plan(2)

  const encrypted = 's7NYXa809k/bVSPwIAmJhPJmEGTtU0hG58hOZy7I0ix6y5HP8LsHBsZCYC/gw5DDFy5DgOcyd18R'
  const wrongKey = '0000000000000000000000000000000000000000000000000000000000000000'

  try {
    dotenv.decrypt(encrypted, wrongKey)
    ct.fail('should have thrown')
  } catch (e) {
    ct.equal(e.code, 'DECRYPTION_FAILED')
    ct.match(e.message, 'DECRYPTION_FAILED')
  }
})

t.test('throws INVALID_DOTENV_KEY when key is empty string', ct => {
  ct.plan(2)

  const encrypted = 's7NYXa809k/bVSPwIAmJhPJmEGTtU0hG58hOZy7I0ix6y5HP8LsHBsZCYC/gw5DDFy5DgOcyd18R'

  try {
    dotenv.decrypt(encrypted, '')
    ct.fail('should have thrown')
  } catch (e) {
    ct.equal(e.code, 'INVALID_DOTENV_KEY')
    ct.match(e.message, 'INVALID_DOTENV_KEY')
  }
})
