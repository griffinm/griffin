import { Card, CardHeader, Button } from "@mui/material";
import { useEffect, useState } from "react";
import { Question } from "@prisma/client";
import { getMany as getManyQuestions } from "../../utils/api/questionClient";
import { Typography } from "@mui/material";
import { Link } from "react-router-dom";
import { urls } from "../../utils/urls";

export function Questions() {
  const [questions, setQuestions] = useState<Question[]>([]);

  useEffect(() => {
    getManyQuestions().then((res) => {
      setQuestions(res.data);
    });
  }, []);

  return (
    <Card>
      <CardHeader
        title="Questions"
      />
      {questions.map((question) => (
        <div className="border-t border-slate-700" key={question.id}>
          <div className="p-3 flex justify-between items-center">
            <Typography variant="body1">{question.question}</Typography>
            <Link to={urls.note(question.noteId)}>
              <Button>View</Button>
            </Link>
          </div>
        </div>
      ))}
    </Card>
  );
}
