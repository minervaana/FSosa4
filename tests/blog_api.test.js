const mongoose = require('mongoose')
const supertest = require('supertest')
const app = require('../app')
const Blog = require('../models/blog')
const bcrypt = require('bcrypt')
const User = require('../models/user')
const helper = require('./test_helper')

const api = supertest(app)

beforeEach(async () => {
    await Blog.deleteMany({})
    await Blog.insertMany(helper.initialBlogs)
})

test('notes are returned as json', async () => {
    await api
        .get('/api/blogs')
        .expect(200)
        .expect('Content-type', /application\/json/)
})

test('there are correct amount of blogs', async () => {
    const response = await api.get('/api/blogs')

    expect(response.body).toHaveLength(helper.initialBlogs.length)
})

test('Identifying field is called id', async () => {
    const response = await api.get('/api/blogs')

    const blogId = response.body[0].id
    expect(blogId).toBeDefined()
})

test('a blog can be added', async () => {
    const newBlog = {
        title: 'Detecting a mistake',
        author: 'Jucca Palmu',
        url: 'www.nono.fi',
        likes: 3
    }

    await api
        .post('/api/blogs')
        .send(newBlog)
        .expect(201)
        .expect('Content-Type', /application\/json/)

    const blogsAtTheEnd = await helper.blogsInDb()
    expect(blogsAtTheEnd).toHaveLength(helper.initialBlogs.length + 1)

    const titles = blogsAtTheEnd.map(blog => blog.title)
    expect(titles).toContain('Detecting a mistake')
})

test('if likes are not initialized the blog is added with likes being zero', async () => {
    const newBlog = {
        title: 'Detecting a mistake',
        author: 'Jucca Palmu',
        url: 'www.nono.fi',
    }

    await api
        .post('/api/blogs')
        .send(newBlog)
        .expect(201)
        .expect('Content-Type', /application\/json/)

    const blogsAtTheEnd = await helper.blogsInDb()
    expect(blogsAtTheEnd).toHaveLength(helper.initialBlogs.length + 1)

    const blog = blogsAtTheEnd.find(blog => blog.title === 'Detecting a mistake')
    expect(blog.likes).toBe(0)

})

test('invalid blog will not be added', async () => {
    const newBlog = {
        author: 'Jucca Palmu',
        likes: 3
    }

    await api
        .post('/api/blogs')
        .send(newBlog)
        .expect(400)

    const response = await api.get('/api/blogs')

    expect(response.body).toHaveLength(helper.initialBlogs.length)
})

test('a blog can be deleted and gives status code 204', async () => {
    const blogsAtStart = await helper.blogsInDb()
    const blogToDelete = blogsAtStart[0]

    await api
        .delete(`/api/blogs/${blogToDelete.id}`)
        .expect(204)

    const blogsAtEnd = await helper.blogsInDb()

    expect(blogsAtEnd).toHaveLength(helper.initialBlogs.length - 1)

    const titles = blogsAtEnd.map(blog => blog.title)
    expect(titles).not.toContain(blogToDelete.title)
})

test('likes in blog can be updated', async () => {
    const blogsAtStart = await helper.blogsInDb()
    const blogToUpdate = blogsAtStart[0]

    const newBlog = {
        title: blogToUpdate.title,
        author: blogToUpdate.author,
        url: blogToUpdate.url,
        likes: blogToUpdate.likes + 1
    }

    await api
        .put(`/api/blogs/${blogToUpdate.id}`)
        .send(newBlog)
        .expect(200)
        .expect('Content-Type', /application\/json/)

    const blogsAtEnd = await helper.blogsInDb()
    const updated = blogsAtEnd.find(blog => blog.id === blogToUpdate.id)
    expect(updated.likes).toEqual(blogToUpdate.likes + 1)


})

describe('when there is initially one user at db', () => {

    beforeEach(async () => {
        await User.deleteMany({})

        const passwordHash = await bcrypt.hash('sekret', 10)
        const user = new User({ username: 'root', passwordHash })

        await user.save()
    })

    test('creation succeeds with a fresh username', async () => {
        const usersAtStart = await helper.usersInDb()

        const newUser = {
            username: 'monni',
            name: 'Jutta Jei',
            password: 'salasana',
        }

        await api
            .post('/api/users')
            .send(newUser)
            .expect(201)
            .expect('Content-Type', /application\/json/)

        const usersAtEnd = await helper.usersInDb()
        expect(usersAtEnd).toHaveLength(usersAtStart.length + 1)

        const usernames = usersAtEnd.map(u => u.username)
        expect(usernames).toContain(newUser.username)
    })

    test('creation fails with a proper statuscode and message if username is taken', async () => {
        const usersAtStart = await helper.usersInDb()

        const newUser = {
            username: 'root',
            name: 'Admin',
            password: 'salasana'
        }

        const result = await api
            .post('/api/users')
            .send(newUser)
            .expect(400)
            .expect('Content-Type', /application\/json/)

        expect(result.body.error).toContain('username must be unique')

        const usersAtEnd = await helper.usersInDb()
        expect(usersAtEnd).toHaveLength(usersAtStart.length)
    })

    test('Too short username cannot be added and gives correct statuscode', async () => {
        const usersAtStart = await helper.usersInDb()

        const invalidUser = {
            username: 'ro',
            name: 'Wannabe',
            password: 'salasana'
        }

        const result = await api
            .post('/api/users')
            .send(invalidUser)
            .expect(400)
            .expect('Content-Type', /application\/json/)

        expect(result.body.error).toContain('User validation failed: username: Path `username` (`ro`) is shorter than the minimum allowed length (3).')

        const usersAtEnd = await helper.usersInDb()
        expect(usersAtEnd).toHaveLength(usersAtStart.length)
    })

    test('A user with a too short password will not be added and gives correct statuscode', async () => {
        const usersAtStart = await helper.usersInDb()

        const invalidUser = {
            username: 'roaas',
            name: 'Wannabe',
            password: 'aa'
        }

        const result = await api
            .post('/api/users')
            .send(invalidUser)
            .expect(400)
            .expect('Content-Type', /application\/json/)

        expect(result.body.error).toContain("password has to be at least 3 characters long")

        const usersAtEnd = await helper.usersInDb()
        expect(usersAtEnd).toHaveLength(usersAtStart.length)
    })

    test('A user without a username cannot be added and gives correct statuscode', async () => {
        const usersAtStart = await helper.usersInDb()

        const invalidUser = {
            username: '',
            name: 'Wannabe',
            password: 'salasana'
        }

        const result = await api
            .post('/api/users')
            .send(invalidUser)
            .expect(400)
            .expect('Content-Type', /application\/json/)

        expect(result.body.error).toContain('User validation failed: username: Path `username` is required.')

        const usersAtEnd = await helper.usersInDb()
        expect(usersAtEnd).toHaveLength(usersAtStart.length)
    })

    test('A user without a password will not be added and gives correct statuscode', async () => {
        const usersAtStart = await helper.usersInDb()

        const invalidUser = {
            username: 'roaas',
            name: 'Wannabe',
            password: ''
        }

        const result = await api
            .post('/api/users')
            .send(invalidUser)
            .expect(400)
            .expect('Content-Type', /application\/json/)

        expect(result.body.error).toContain("password has to be at least 3 characters long")

        const usersAtEnd = await helper.usersInDb()
        expect(usersAtEnd).toHaveLength(usersAtStart.length)
    })
})


afterAll(() => {
    mongoose.connection.close
})