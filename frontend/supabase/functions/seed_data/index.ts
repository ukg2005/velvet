import { createClient } from "npm:@supabase/supabase-js@2.47.0"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, Authorization, X-Client-Info, Apikey",
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    })
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")

    if (!supabaseUrl || !supabaseKey) {
      throw new Error("Missing Supabase configuration")
    }

    const supabase = createClient(supabaseUrl, supabaseKey)

    const moviesData = [
      {
        title: "Oppenheimer",
        poster_path:
          "https://image.tmdb.org/t/p/w500/8Gxv8gSZDMIA_APcsqBnwLlGDVn.jpg",
        release_date: "2023-07-21",
        score: 8.1,
      },
      {
        title: "Killers of the Flower Moon",
        poster_path:
          "https://image.tmdb.org/t/p/w500/DKHw3NF49SoKcVWRf1K5NV9Xpym.jpg",
        release_date: "2023-10-20",
        score: 8.0,
      },
      {
        title: "The Zone of Interest",
        poster_path:
          "https://image.tmdb.org/t/p/w500/5L6bLDNh0kYcVJvpvLx9xeHFzrr.jpg",
        release_date: "2023-10-27",
        score: 7.8,
      },
      {
        title: "Barbie",
        poster_path:
          "https://image.tmdb.org/t/p/w500/iuFNMS8U5cb6xvzFAbThma-dNuA.jpg",
        release_date: "2023-07-21",
        score: 7.5,
      },
      {
        title: "Past Lives",
        poster_path:
          "https://image.tmdb.org/t/p/w500/yR6DvNKqKxYbAc2hKVZ9BbKfNAJ.jpg",
        release_date: "2023-06-02",
        score: 7.9,
      },
      {
        title: "Poor Things",
        poster_path:
          "https://image.tmdb.org/t/p/w500/ihMIy4b8MphVWJPl6CYA3cFnJZj.jpg",
        release_date: "2023-12-08",
        score: 7.6,
      },
      {
        title: "American Fiction",
        poster_path:
          "https://image.tmdb.org/t/p/w500/ArLn1ibkUwGKWXCnDKx9e6x17rg.jpg",
        release_date: "2023-10-20",
        score: 7.7,
      },
      {
        title: "Anatomy of a Fall",
        poster_path:
          "https://image.tmdb.org/t/p/w500/nP6RxItkJBr79Q1fvqT1F7SEd5q.jpg",
        release_date: "2023-10-20",
        score: 8.0,
      },
    ]

    const { data: insertedMovies, error: moviesError } = await supabase
      .from("movies")
      .insert(moviesData)
      .select()

    if (moviesError) {
      console.error("Error inserting movies:", moviesError)
      throw moviesError
    }

    const reviews = [
      {
        username: "Sarah Chen",
        movie_id: insertedMovies?.[0]?.id,
        rating: 9,
        review_text: "An absolute masterpiece. Nolan at his finest.",
      },
      {
        username: "Marcus Williams",
        movie_id: insertedMovies?.[1]?.id,
        rating: 8,
        review_text: "Scorsese delivers a powerful and emotional journey.",
      },
      {
        username: "Elena Rodriguez",
        movie_id: insertedMovies?.[2]?.id,
        rating: 8,
        review_text:
          "A haunting and thought-provoking examination of history.",
      },
      {
        username: "Alex Patel",
        movie_id: insertedMovies?.[3]?.id,
        rating: 7,
        review_text: "Fun, colorful, and surprisingly deep.",
      },
      {
        username: "Jamie Lee",
        movie_id: insertedMovies?.[4]?.id,
        rating: 9,
        review_text:
          "A beautiful meditation on love and destiny across time.",
      },
      {
        username: "David Kim",
        movie_id: insertedMovies?.[0]?.id,
        rating: 10,
        review_text:
          "The cinematography alone is worth the price of admission.",
      },
      {
        username: "Nina Ortega",
        movie_id: insertedMovies?.[5]?.id,
        rating: 8,
        review_text: "Visually stunning with excellent performances.",
      },
      {
        username: "Thomas Mueller",
        movie_id: insertedMovies?.[6]?.id,
        rating: 7,
        review_text: "Sharp, witty, and culturally relevant.",
      },
      {
        username: "Zoe Harrison",
        movie_id: insertedMovies?.[7]?.id,
        rating: 9,
        review_text: "A legal thriller that keeps you on edge.",
      },
      {
        username: "Lucas Santos",
        movie_id: insertedMovies?.[1]?.id,
        rating: 8,
        review_text: "DiCaprio and De Niro carry this beautifully.",
      },
    ]

    const { error: reviewsError } = await supabase
      .from("user_reviews")
      .insert(reviews)

    if (reviewsError) {
      console.error("Error inserting reviews:", reviewsError)
      throw reviewsError
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Data seeded successfully",
        moviesCount: insertedMovies?.length,
        reviewsCount: reviews.length,
      }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    )
  } catch (error) {
    console.error("Seed error:", error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    )
  }
})
