import express from 'express'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const app = express()
app.use(express.json())

const intentions = []

app.post('/intention', async (req, res) => {

    await prisma.intention.create({
        data: {
            origin_cep: req.body.origin_cep,
            destination_cep: req.body.destination_cep
        }
    })

    res.status(201).json(req.body)
})

app.put('/intention/:id', async (req, res) => {

    await prisma.intention.update({
        where: {
            id: req.params.id
        },
        data: {
            origin_cep: req.body.origin_cep,
            destination_cep: req.body.destination_cep, 
            lead_id: req.body.lead_id
        }
    })

    res.status(201).json(req.body)
})

app.post('/lead', async (req, res) => {
    await prisma.lead.create({
        data: {
            name: req.body.name,
            email: req.body.email
        }
    })

    res.status(201).json(req.body)
})

app.get('/docs', (req, res) => {

})


app.listen(3000)