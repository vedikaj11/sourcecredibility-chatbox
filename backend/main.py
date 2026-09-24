from typing import Optional

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from credibility import analyze_url, analyze_text
from chatbot import ask_gemini
from database import get_connection


app = FastAPI()


app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:5173"
    ],
    allow_methods=["*"],
    allow_headers=["*"],
)


class SourceRequest(BaseModel):
    url: Optional[str] = None
    text: Optional[str] = None


class ChatRequest(BaseModel):
    question: str
    fact_check_context: Optional[str] = ""


@app.get("/")
def home():
    return {"message": "Backend is running"}


@app.post("/source-credibility")
def source_credibility(req: SourceRequest):

    # -------------------------
    # URL INPUT
    # -------------------------
    if req.url and req.url.strip():

        url = req.url.strip()

        result = analyze_url(url)

        connection = None
        cursor = None

        try:
            connection = get_connection()
            cursor = connection.cursor()

            # 1. Save scan input
            cursor.execute(
                """
                INSERT INTO SCAN_INPUT
                (input_type, source_url)
                VALUES (%s, %s)
                """,
                ("url", url)
            )

            scan_id = cursor.lastrowid

            # 2. Save source credibility
            cursor.execute(
                """
                INSERT INTO SOURCE_CREDIBILITY_DETAILS
                (scan_id, domain, credibility_rating, is_known_reliable)
                VALUES (%s, %s, %s, %s)
                """,
                (
                    scan_id,
                    result.get("source"),
                    result.get("label"),
                    result.get("score", 0) >= 75
                )
            )

            # 3. Save overall scan result
            cursor.execute(
                """
                INSERT INTO SCAN_RESULTS
                (scan_id, source_score, final_source)
                VALUES (%s, %s, %s)
                """,
                (
                    scan_id,
                    result.get("score"),
                    result.get("score")
                )
            )

            connection.commit()

            # Return database ID too
            result["scan_id"] = scan_id

            return result

        except Exception as error:

            if connection:
                connection.rollback()

            raise HTTPException(
                status_code=500,
                detail=f"Database error: {str(error)}"
            )

        finally:

            if cursor:
                cursor.close()

            if connection:
                connection.close()

    # -------------------------
    # TEXT INPUT
    # -------------------------
    if req.text and req.text.strip():

        text = req.text.strip()

        result = analyze_text(text)

        connection = None
        cursor = None

        try:
            connection = get_connection()
            cursor = connection.cursor()

            # 1. Save scan input
            cursor.execute(
                """
                INSERT INTO SCAN_INPUT
                (input_type, source_url)
                VALUES (%s, %s)
                """,
                ("text", None)
            )

            scan_id = cursor.lastrowid

            # 2. Save overall scan result
            cursor.execute(
                """
                INSERT INTO SCAN_RESULTS
                (scan_id, source_score, final_source)
                VALUES (%s, %s, %s)
                """,
                (
                    scan_id,
                    result.get("score"),
                    result.get("score")
                )
            )

            # 3. Save fact-check information
            cursor.execute(
                """
                INSERT INTO FACT_CHECK_DETAILS
                (scan_id, claim_text, verdict, claim_source_url)
                VALUES (%s, %s, %s, %s)
                """,
                (
                    scan_id,
                    text,
                    result.get("label"),
                    result.get("matches", [{}])[0].get("url")
                    if result.get("matches")
                    else None
                )
            )

            connection.commit()

            result["scan_id"] = scan_id

            return result

        except Exception as error:

            if connection:
                connection.rollback()

            raise HTTPException(
                status_code=500,
                detail=f"Database error: {str(error)}"
            )

        finally:

            if cursor:
                cursor.close()

            if connection:
                connection.close()

    raise HTTPException(
        status_code=400,
        detail="Send either a url or text"
    )


@app.post("/chat")
def chat(req: ChatRequest):

    if not req.question.strip():
        raise HTTPException(
            status_code=400,
            detail="Question cannot be empty"
        )

    try:
        # Ask Gemini
        result = ask_gemini(
            req.question.strip(),
            req.fact_check_context or ""
        )

        # If Gemini failed
        if not result.get("success"):
            return result

        # Connect to MySQL
        connection = get_connection()
        cursor = connection.cursor()

        # Save chat
        cursor.execute(
            """
            INSERT INTO CHAT_HISTORY
            (scan_id, question, answer)
            VALUES (%s, %s, %s)
            """,
            (
                None,
                req.question.strip(),
                result.get("answer")
            )
        )

        connection.commit()

        cursor.close()
        connection.close()

        return result

    except Exception as error:

        raise HTTPException(
            status_code=500,
            detail=f"Chat database error: {str(error)}"
        )

    return ask_gemini(
        req.question.strip(),
        req.fact_check_context or ""
    )