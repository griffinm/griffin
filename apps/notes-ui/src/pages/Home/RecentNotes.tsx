import { useEffect, useState } from "react";
import { Note } from "@prisma/client";
import { fetchRecentNotes } from "../../utils/api/noteClient";
import { Loading } from "../../components/Loading";
import {
  Card,
  CardHeader,
  Typography,
  Button
} from "@mui/material";
import { Link } from "react-router-dom";
import { formatDistance } from "date-fns";
import { urls } from "../../utils/urls";
import { useNotes } from "../../providers/NoteProvider";
import AddIcon from '@mui/icons-material/Add';

export function RecentNotes() {
  const [recentNotes, setRecentNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const { createNote, defaultNotebook } = useNotes();
  
  useEffect(() => {
    fetchRecentNotes().then((res) => {
      setRecentNotes(res.data);
      setLoading(false);
    });
  }, []);

  return (
    <Card>
      <CardHeader
        title="Recent Notes"
        action={
          <Button
            variant="outlined"
            onClick={() => createNote(defaultNotebook!.id)}
            startIcon={<AddIcon />}
          >
            Add
          </Button>
        }
      />

        {loading && <Loading />}
        {recentNotes.map((note) => (
          <div className="border-t border-slate-700" key={note.id} >
            <div className="p-3 flex justify-between items-center">
              <div>
                <Typography variant="body1">{note.title}</Typography>
                <Typography variant="caption">
                  Last Updated: {formatDistance(note.updatedAt, new Date())} ago
                </Typography>
              </div>
              <Link to={urls.note(note.id)}>
                <Button>View</Button>
              </Link>
            </div>
          </div>
        ))}

    </Card>
  );
}
