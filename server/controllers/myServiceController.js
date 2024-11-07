const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const fetchAllServices = async (req, res) => {
  try {
    const services = await prisma.service.findMany({
      include: { category: true },
    });
    res.json(services);
  } catch (error) {
    console.error("Error fetching services:", error);
    res.status(500).json({ error: "Failed to fetch services" });
  }
};

const updateService = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      description,
      price,
      duration,
      categoryId,
      providerId,
      image,
    } = req.body;

    const updatedService = await prisma.service.update({
      where: { id: parseInt(id) },
      data: {
        name,
        description,
        price: parseFloat(price),
        duration: parseInt(duration),
        categoryId: parseInt(categoryId),
        providerId: parseInt(providerId),
        image,
      },
    });

    res.json({
      success: true,
      message: "Service updated successfully",
      service: updatedService,
    });
  } catch (error) {
    console.error("Error updating service:", error);
    res.status(500).json({ error: "Failed to update service" });
  }
};

// New function to fetch service details by ID
const fetchServiceDetails = async (req, res) => {
  try {
    const { id } = req.params;

    const service = await prisma.service.findUnique({
      where: { id: parseInt(id) },
      include: {
        category: true,
        provider: {
          select: {
            id: true,
            username: true,
            email: true,
            photoUrl: true,
            rating: true,
            isAvailable: true,
          },
        },
        reviews: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                photoUrl: true,
              },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
          take: 5, // Get only the 5 most recent reviews
        },
        bookings: {
          where: {
            status: "CONFIRMED",
          },
          select: {
            id: true,
            bookingDate: true,
            status: true,
          },
          orderBy: {
            bookingDate: "asc",
          },
          take: 5, // Get only the 5 upcoming bookings
        },
      },
    });

    if (!service) {
      return res.status(404).json({ error: "Service not found" });
    }

    // Calculate average rating from reviews
    const averageRating =
      service.reviews.length > 0
        ? service.reviews.reduce((acc, review) => acc + review.rating, 0) /
          service.reviews.length
        : 0;

    // Add average rating to the response
    const serviceWithRating = {
      ...service,
      averageRating: parseFloat(averageRating.toFixed(1)),
    };

    res.json(serviceWithRating);
  } catch (error) {
    console.error("Error fetching service details:", error);
    res.status(500).json({ error: "Failed to fetch service details" });
  }
};

module.exports = {
  fetchAllServices,
  updateService,
  fetchServiceDetails,
};
