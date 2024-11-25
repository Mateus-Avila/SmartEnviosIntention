import request from 'supertest'
import app from '../server'
import { PrismaClient } from '@prisma/client'
import { intentionSchema, leadSchema } from '../schemas'

// Mock do Prisma Client
jest.mock('@prisma/client', () => {
    const mockPrisma = {
        intention: {
            create: jest.fn(),
            findUnique: jest.fn(),
            update: jest.fn(),
        },
        lead: {
            create: jest.fn(),
        },
        $disconnect: jest.fn(),
    }
    return { PrismaClient: jest.fn(() => mockPrisma) }
})

// Mock do Nodemailer
jest.mock('nodemailer', () => {
    return {
        createTransport: jest.fn().mockReturnValue({
            sendMail: jest.fn(), // Mocka o método sendMail
        }),
    }
})

// Importar mocks e configurá-los
import nodemailer from 'nodemailer'
const sendMailMock = nodemailer.createTransport().sendMail

// Instância mockada do Prisma
const prisma = new PrismaClient()
prisma.intention = {
    create: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    deleteMany: jest.fn(),
}
prisma.lead = {
    create: jest.fn(),
    deleteMany: jest.fn(),
}

describe('POST /intention', () => {
    beforeEach(() => {
        prisma.intention.create.mockClear()
    })

    it('Deve criar uma intenção com sucesso', async () => {
        prisma.intention.create.mockResolvedValue({
            id: '1',
            origin_cep: '12345678',
            destination_cep: '87654321',
        })

        const response = await request(app)
            .post('/intention')
            .send({
                origin_cep: '12345678',
                destination_cep: '87654321',
            })

        expect(response.status).toBe(201)
        expect(response.body).toHaveProperty('id')
        expect(prisma.intention.create).toHaveBeenCalledTimes(1)
    })

    it('Deve retornar erro ao enviar dados inválidos', async () => {
        const response = await request(app)
            .post('/intention')
            .send({
                origin_cep: '12345',
                destination_cep: 'not-a-cep',
            })

        expect(response.status).toBe(400)
        expect(response.body.error).toBeDefined()
        expect(prisma.intention.create).not.toHaveBeenCalled()
    })
})

describe('POST /lead', () => {
    beforeEach(() => {
        prisma.lead.create.mockClear()
        sendMailMock.mockClear()
        sendMailMock.mockResolvedValue({
            accepted: ['joao.silva@example.com'],
            rejected: [],
        }) // Configurar retorno do mock
    })

    it('Deve criar um lead com sucesso e enviar email', async () => {
        prisma.lead.create.mockResolvedValue({
            id: '1',
            name: 'João Silva',
            email: 'joao.silva@example.com',
        })

        const response = await request(app)
            .post('/lead')
            .send({
                name: 'João Silva',
                email: 'joao.silva@example.com',
            })

        expect(response.status).toBe(201)
        expect(response.body).toHaveProperty('id')
        expect(prisma.lead.create).toHaveBeenCalledTimes(1)
        expect(sendMailMock).toHaveBeenCalledTimes(1)
        expect(sendMailMock).toHaveBeenCalledWith(
            expect.objectContaining({
                to: 'joao.silva@example.com',
                subject: 'Obrigado por se cadastrar!',
            })
        )
    })

    it('Deve retornar erro ao enviar dados inválidos', async () => {
        const response = await request(app)
            .post('/lead')
            .send({
                name: 'JS',
                email: 'not-an-email',
            })

        expect(response.status).toBe(400)
        expect(prisma.lead.create).not.toHaveBeenCalled()
        expect(sendMailMock).not.toHaveBeenCalled()
    })
})

describe('PUT /intention/:id', () => {
    beforeEach(() => {
        prisma.intention.findUnique.mockClear()
        prisma.intention.update.mockClear()
    })

    it('Deve atualizar uma intenção existente', async () => {
        prisma.intention.findUnique.mockResolvedValue({
            id: '1',
            origin_cep: '12345678',
            destination_cep: '87654321',
        })
        prisma.intention.update.mockResolvedValue({
            id: '1',
            origin_cep: '22222222',
            destination_cep: '33333333',
        })

        const response = await request(app)
            .put('/intention/1')
            .send({
                origin_cep: '22222222',
                destination_cep: '33333333',
            })

        expect(response.status).toBe(200)
        expect(response.body.origin_cep).toBe('22222222')
        expect(prisma.intention.findUnique).toHaveBeenCalledTimes(1)
        expect(prisma.intention.update).toHaveBeenCalledTimes(1)
    })

    it('Deve retornar erro se a intenção não existir', async () => {
        prisma.intention.findUnique.mockResolvedValue(null)

        const response = await request(app)
            .put('/intention/999')
            .send({
                origin_cep: '22222222',
                destination_cep: '33333333',
            })

        expect(response.status).toBe(404)
        expect(prisma.intention.findUnique).toHaveBeenCalledTimes(1)
        expect(prisma.intention.update).not.toHaveBeenCalled()
    })
})

describe('Validações com Joi', () => {
    it('Deve validar intention corretamente', () => {
        const { error } = intentionSchema.validate({
            origin_cep: '12345678',
            destination_cep: '87654321',
        })
        expect(error).toBeUndefined()
    })

    it('Deve falhar ao validar intention com dados inválidos', () => {
        const { error } = intentionSchema.validate({
            origin_cep: 'invalid',
            destination_cep: '12345',
        })
        expect(error).toBeDefined()
    })

    it('Deve validar lead corretamente', () => {
        const { error } = leadSchema.validate({
            name: 'João Silva',
            email: 'joao.silva@example.com',
        })
        expect(error).toBeUndefined()
    })

    it('Deve falhar ao validar lead com dados inválidos', () => {
        const { error } = leadSchema.validate({
            name: 'JS',
            email: 'not-an-email',
        })
        expect(error).toBeDefined()
    })
})

afterAll(async () => {
    await prisma.$disconnect()
})
