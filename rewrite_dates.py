import sys

# Read the hash-date mapping
hash_to_date = {}
with open('hash_date_map.txt') as f:
    for line in f:
        parts = line.strip().split()
        if len(parts) == 2:
            hash_to_date[parts[0]] = parts[1]

def rewrite_commit(commit):
    new_date = hash_to_date.get(commit.original_id.decode(), None)
    if new_date:
        commit.author_date = new_date.encode()
        commit.committer_date = new_date.encode()

if __name__ == "__main__":
    import git_filter_repo as fr
    fr.FilterRepo(commit_callback=rewrite_commit) 