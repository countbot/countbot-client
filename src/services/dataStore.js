import api from '@/services/api';

export default {
  fetchMessages(count, offset) {
    return api().post('/graphql', {
      query: `
      query($groupId: String!, $offset: Int!) {
        Group(id: $groupId) {
          p: posts(first: ${count}, offset: $offset) {
            i: id
            te: text
            p: posted_by {
              i: id
              n: name
            }
            ti: timestamp {
              f: formatted
            }
          }
        }
      }`,
      variables: {
        groupId: process.env.VUE_APP_GROUP_ID,
        offset,
      },
    });
  },
  fetchMessage(id) {
    return api().post('/graphql', {
      query: `
      query($id: String!) {
        p: Message(id: $id) {
          i: id
          te: text
          p: posted_by {
            i: id
            n: name
          }
          ti: timestamp {
            f: formatted
          }
        }
      }`,
      variables: {
        id,
      },
    });
  },
};
