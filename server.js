import express from 'express'
import { PrismaClient } from '@prisma/client'
import nodemailer from 'nodemailer'
import swaggerUi from 'swagger-ui-express'
import swaggerJsdoc from 'swagger-jsdoc'
import { intentionSchema, leadSchema } from './schemas.js'

// Criação de variáveis para utilização de bibliotecas
const prisma = new PrismaClient()
const app = express()
app.use(express.json())

// Criação do transporter para enviar email de criação de leads
const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
        user: 'testemateusprogramacao@gmail.com',
        pass: 'trni pgqm odgi sort',
    },
})

// Método POST da rota /intention
app.post('/intention', async (req, res, next) => {
    const { error } = intentionSchema.validate(req.body)
    if (error) {
        return res.status(400).json({ error: error.details[0].message })
    }
    try {
        const createdIntention = await prisma.intention.create({
            data: {
                origin_cep: req.body.origin_cep,
                destination_cep: req.body.destination_cep,
            },
        })
        res.status(201).json(createdIntention)
    } catch (err) {
        next(err)
    }
})

// Método PUT da rota /intention/:id
app.put('/intention/:id', async (req, res, next) => {
    const { error } = intentionSchema.validate(req.body)
    if (error) {
        return res.status(400).json({ error: error.details[0].message })
    }
    try {
        const intention = await prisma.intention.findUnique({
            where: { id: req.params.id },
        })
        if (!intention) {
            return res.status(404).json({ error: 'Intention not found' })
        }

        const updatedIntention = await prisma.intention.update({
            where: { id: req.params.id },
            data: {
                origin_cep: req.body.origin_cep,
                destination_cep: req.body.destination_cep,
                lead_id: req.body.lead_id,
            },
        })
        res.status(200).json(updatedIntention)
    } catch (err) {
        next(err)
    }
})

// Método POST da rota /lead
app.post('/lead', async (req, res, next) => {
    const { error } = leadSchema.validate(req.body)
    if (error) {
        return res.status(400).json({ error: error.details[0].message })
    }
    try {
        const createdLead = await prisma.lead.create({
            data: {
                name: req.body.name,
                email: req.body.email,
            },
        })
        
        res.status(201).json(createdLead)

        // Envio do Email
        try {
            await transporter.sendMail({
                from: 'Leads Smart Envios <testemateusprogramacao@gmail.com>',
                to: req.body.email,
                subject: 'Obrigado por se cadastrar!',
                html: `<h1>Olá, ${req.body.name}</h1> <p>Obrigado por se cadastrar em nossa plataforma!</p>`,
                text: `Olá. ${req.body.name}, obrigado por se cadastrar em nossa plataforma!`,
            })
        } catch (emailError) {
            console.error(`Erro ao enviar email para ${req.body.email}:`, emailError)
        }

    } catch (err) {
        next(err)
    }
})

// Rota /docs
app.get('/docs', (req, res) => {})

// Tratamento de erro
app.use((err, req, res, next) => {
    console.error(err.stack)
    res.status(500).json({ error: err.message || 'Internal server error' })
})

//Exporta o app para ser utilizado em testes com jest
export default app

app.listen(3000, () => {
    console.log('Servidor rodando na porta 3000')
})
