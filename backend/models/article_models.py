from pydantic import BaseModel

class ArticleAnalysisRequest(BaseModel):
    student_answer: str


class ArticleAnalysisInitResponse(BaseModel):
    message: str
    next_question: str


class ArticleAnalysisFollowupResponse(BaseModel):
    reflection: str
    clarification: str
    followup_question: str
