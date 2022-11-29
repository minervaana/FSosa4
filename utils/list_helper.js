const dummy = (blogs) => {
    return 1
}

const totalLikes = (blogs) => {
    const likes = blogs.map(blog => blog.likes)
    const max = likes.reduce((a, b) => Math.max(a, b), 0)
    console.log(max)
    return max
}

const favoriteBlog = (blogs) => {
    const max = totalLikes(blogs)
    const favorite = blogs.filter(blog => blog.likes === max)
    if (favorite.length === 0) {
        return 'no blogs'
    }
    return favorite[0]

}

module.exports = {
    dummy,
    totalLikes,
    favoriteBlog
}