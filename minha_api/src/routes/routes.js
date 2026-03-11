const router = express.Router()
router.get('/', (req, res) => {
    res.json({mensagem: "API funcionando"})
})
router.get('/usuarios', (req, res) => {
    const usuarios = [
        {id: 1, nome: 'Ana'},
        {id: 2, nome: 'Carlos'}
    ]
    res.json(usuarios)
    }
)
module.exports = router