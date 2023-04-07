const t = require('tap')

const dotenv = require('../lib/main')

t.test('can decrypt', ct => {
  ct.plan(1)

  const encrypted = 's7NYXa809k/bVSPwIAmJhPJmEGTtU0hG58hOZy7I0ix6y5HP8LsHBsZCYC/gw5DDFy5DgOcyd18R'
  const keyStr = 'ddcaa26504cd70a6fef9801901c3981538563a1767c297cb8416e8a38c62fe00'

  const result = dotenv.decrypt(encrypted, keyStr)

  ct.equal(result, '# development@v6\nALPHA="zeta"')
})
