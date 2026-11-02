import {test} from 'node:test';
import assert from 'node:assert/strict';
import {validateQuiz} from '../src/utils/quizzes';
import type {Quiz} from '../src/types';
const quiz:Quiz={id:'test',title:'امتحان المعلم',grade:'sec3',gradeTitle:'',unitTitle:'',description:'',isComprehensiveExam:false,timeLimitMinutes:20,passingScore:70,createdAt:'',questions:[{id:'q',type:'mcq',prompt:'سؤال من المعلم',options:['أ','ب'],correctAnswer:'ب',explanation:'',points:3}]};
test('publishes teacher-authored content without a preset question',()=>assert.doesNotThrow(()=>validateQuiz(quiz)));
test('rejects empty questions and unspecified answers',()=>{assert.throws(()=>validateQuiz({...quiz,questions:[]}));assert.throws(()=>validateQuiz({...quiz,questions:[{...quiz.questions[0],correctAnswer:''}]}));});
test('rejects duplicate options, invalid score and duration',()=>{assert.throws(()=>validateQuiz({...quiz,questions:[{...quiz.questions[0],options:['ب','ب']}]}));assert.throws(()=>validateQuiz({...quiz,questions:[{...quiz.questions[0],points:NaN}]}));assert.throws(()=>validateQuiz({...quiz,timeLimitMinutes:0}));});
