const { default: z } = require("zod");


const createSchema = z.object({
    departmentId: z.coerce.number().int().positive().optional(),
    firstName: z.string().min(1).max(60),
    lastName: z.string().min(1).max(60),
    email: z.string().email().optional(),
    password: z.string().min(8).max(72).optional(),
    phone: z.string().max(30).optional(),
})
const updateSchema = createSchema.partial();
const listQuerySchema = z.object({
    page: z.coerce.number().int().positive().optional(),
    limit: z.coerce.number().int().positive().max(100).optional(),

})

module.exports = {createSchema, updateSchema, listQuerySchema };